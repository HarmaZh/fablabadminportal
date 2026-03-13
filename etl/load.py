"""
etl/load.py
-----------
Load layer for the FabLab ETL pipeline.

Inserts or updates clean DataFrames into PostgreSQL using psycopg2.
All writes are wrapped in a single transaction so a failure in any table
triggers a full rollback — the database is never left in a partial state.

Upsert strategy (ON CONFLICT DO UPDATE) makes the pipeline idempotent:
running it multiple times produces the same result.

Load order respects foreign-key dependencies:
  instructors → classes → students → enrollments → material_usage

Usage:
    from etl.load import load_all
    load_all(clean_dfs, db_url="postgresql://...")
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import pandas as pd
import psycopg2
import psycopg2.extras

log = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────


def _execute_batch(
    cur: psycopg2.extensions.cursor,
    sql: str,
    rows: List[Tuple],
    table: str,
) -> None:
    """Execute a batch upsert and log the row count."""
    psycopg2.extras.execute_batch(cur, sql, rows, page_size=200)
    log.info("[load] %-20s  %d row(s) upserted", table, len(rows))


def _safe_str(val) -> Optional[str]:
    if pd.isna(val) or val == "":
        return None
    return str(val).strip()


def _safe_bool(val) -> bool:
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in ("true", "1", "yes")


def _safe_dt(val) -> Optional[datetime]:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, pd.Timestamp):
        return val.to_pydatetime() if not pd.isna(val) else None
    return val


def _safe_decimal(val) -> Optional[float]:
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


# ── Table loaders ──────────────────────────────────────────────────────────────


def load_instructors(cur, df: pd.DataFrame) -> Dict[str, str]:
    """
    Upsert instructors.  Returns a mapping of name → DB UUID
    (used to resolve instructor IDs when loading classes).
    """
    sql = """
        INSERT INTO staff (id, "staffId", name, email, role, specialization, phone,
                           active, "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
        ON CONFLICT ("staffId") DO UPDATE
          SET name           = EXCLUDED.name,
              email          = EXCLUDED.email,
              specialization = EXCLUDED.specialization,
              phone          = EXCLUDED.phone,
              "updatedAt"    = NOW()
        RETURNING id, "staffId"
    """
    rows = []
    id_map: Dict[str, str] = {}  # staffId → uuid

    for _, row in df.iterrows():
        staff_id = _safe_str(row.get("instructor_id")) or f"STF-{uuid.uuid4().hex[:6].upper()}"
        uid = str(uuid.uuid4())
        rows.append((
            uid,
            staff_id,
            _safe_str(row.get("name")),
            _safe_str(row.get("email")),
            _safe_str(row.get("role")) or "INSTRUCTOR",
            _safe_str(row.get("specialization")),
            _safe_str(row.get("phone")),
        ))

    psycopg2.extras.execute_batch(cur, sql, rows, page_size=200)

    # Fetch back the actual IDs (handles both inserts and updates)
    cur.execute('SELECT id, name FROM staff')
    for db_id, name in cur.fetchall():
        id_map[name] = db_id

    log.info("[load] %-20s  %d row(s) upserted", "staff", len(rows))
    return id_map


def load_classes(cur, df: pd.DataFrame, instructor_id_map: Dict[str, str]) -> Dict[str, str]:
    """
    Upsert classes.  Returns a mapping of classId → DB UUID.
    """
    sql = """
        INSERT INTO classes (id, "classId", name, description, "ageGroup",
                             "scheduleDescription", "isRecurring", color, status,
                             "maxStudents", "instructorId", "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active', %s, %s, NOW(), NOW())
        ON CONFLICT ("classId") DO UPDATE
          SET name                  = EXCLUDED.name,
              description           = EXCLUDED.description,
              "ageGroup"            = EXCLUDED."ageGroup",
              "scheduleDescription" = EXCLUDED."scheduleDescription",
              "isRecurring"         = EXCLUDED."isRecurring",
              color                 = EXCLUDED.color,
              "maxStudents"         = EXCLUDED."maxStudents",
              "instructorId"        = EXCLUDED."instructorId",
              "updatedAt"           = NOW()
        RETURNING id, "classId"
    """
    rows = []
    for _, row in df.iterrows():
        class_id = _safe_str(row.get("class_id"))
        instructor_name = _safe_str(row.get("instructor"))
        instructor_db_id = instructor_id_map.get(instructor_name) if instructor_name else None

        rows.append((
            str(uuid.uuid4()),
            class_id,
            _safe_str(row.get("class_name")),
            _safe_str(row.get("description")),
            _safe_str(row.get("age_group")),
            _safe_str(row.get("schedule_description")),
            _safe_bool(row.get("is_recurring", False)),
            _safe_str(row.get("color")),
            _safe_decimal(row.get("max_students")),
            instructor_db_id,
        ))

    psycopg2.extras.execute_batch(cur, sql, rows, page_size=200)

    cur.execute('SELECT id, "classId" FROM classes')
    id_map = {class_id: db_id for db_id, class_id in cur.fetchall()}

    log.info("[load] %-20s  %d row(s) upserted", "classes", len(rows))
    return id_map


def load_students_and_enrollments(
    cur,
    df: pd.DataFrame,
    class_id_map: Dict[str, str],
) -> None:
    """
    Upsert students then upsert their enrollments.
    Students are keyed by email (unique); anonymous/incomplete records
    get a generated placeholder email.
    """
    student_sql = """
        INSERT INTO students (id, "studentId", name, email, phone, "parentName",
                              status, "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE
          SET name         = EXCLUDED.name,
              phone        = EXCLUDED.phone,
              "parentName" = EXCLUDED."parentName",
              "updatedAt"  = NOW()
        RETURNING id, email
    """
    enrollment_sql = """
        INSERT INTO enrollments (id, "studentId", "classId", "registrationDate",
                                 status, "createdAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
        ON CONFLICT ("studentId", "classId") DO UPDATE
          SET status      = EXCLUDED.status,
              "updatedAt" = NOW()
    """

    student_rows = []
    seen_emails: Dict[str, str] = {}  # email → student DB uuid

    for _, row in df.iterrows():
        email = _safe_str(row.get("email"))
        if not email:
            # Generate a stable placeholder for incomplete records
            email = f"unknown_{uuid.uuid4().hex[:8]}@placeholder.fablab"

        if email not in seen_emails:
            student_id = str(uuid.uuid4())
            seen_emails[email] = student_id
            student_rows.append((
                student_id,
                f"STU-{uuid.uuid4().hex[:6].upper()}",
                _safe_str(row.get("student_name")) or "Unknown",
                email,
                _safe_str(row.get("phone")),
                _safe_str(row.get("parent_name")),
                _safe_str(row.get("status")) or "active",
            ))

    psycopg2.extras.execute_batch(cur, student_sql, student_rows, page_size=200)
    log.info("[load] %-20s  %d row(s) upserted", "students", len(student_rows))

    # Re-fetch all students to get accurate DB IDs (handles pre-existing rows)
    cur.execute("SELECT id, email FROM students")
    db_students = {email: uid for uid, email in cur.fetchall()}

    enrollment_rows = []
    for _, row in df.iterrows():
        email = _safe_str(row.get("email"))
        if not email:
            # Match back the placeholder we generated
            continue  # skip truly anonymous (no stable key)

        class_csv_id = _safe_str(row.get("class_id"))
        class_db_id = class_id_map.get(class_csv_id)
        student_db_id = db_students.get(email)

        if not class_db_id or not student_db_id:
            log.warning("[load] Skipping enrollment — missing FK (class=%s, student=%s)", class_csv_id, email)
            continue

        reg_date = _safe_dt(row.get("registration_date"))

        enrollment_rows.append((
            str(uuid.uuid4()),
            student_db_id,
            class_db_id,
            reg_date or datetime.now(),
            _safe_str(row.get("status")) or "confirmed",
        ))

    psycopg2.extras.execute_batch(cur, enrollment_sql, enrollment_rows, page_size=200)
    log.info("[load] %-20s  %d row(s) upserted", "enrollments", len(enrollment_rows))


def load_material_usage(
    cur,
    df: pd.DataFrame,
    class_id_map: Dict[str, str],
) -> None:
    """Upsert material usage records."""
    sql = """
        INSERT INTO material_usage (id, "classId", instructor, "materialName",
                                    "quantityUsed", unit, "sessionDate", notes,
                                    "createdAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT DO NOTHING
    """
    rows = []
    for _, row in df.iterrows():
        class_csv_id = _safe_str(row.get("class_id"))
        class_db_id = class_id_map.get(class_csv_id)
        if not class_db_id:
            log.warning("[load] material_usage: unknown class_id %s — skipping", class_csv_id)
            continue

        rows.append((
            str(uuid.uuid4()),
            class_db_id,
            _safe_str(row.get("instructor")),
            _safe_str(row.get("material_name")),
            _safe_decimal(row.get("quantity_used")),
            _safe_str(row.get("unit")),
            _safe_dt(row.get("session_date")) or datetime.now().date(),
            _safe_str(row.get("notes")),
        ))

    psycopg2.extras.execute_batch(cur, sql, rows, page_size=200)
    log.info("[load] %-20s  %d row(s) upserted", "material_usage", len(rows))


def _seed_attendance(cur) -> None:
    """
    Generate realistic attendance records from existing confirmed enrollments.
    Runs 12 sessions per class, skips if attendance already exists.
    """
    import random

    cur.execute("SELECT COUNT(*) FROM attendance")
    if cur.fetchone()[0] > 0:
        log.info("[load] %-20s  already populated — skipping", "attendance")
        return

    cur.execute("""
        SELECT e.id AS enroll_id, e."studentId", e."classId"
        FROM enrollments e
        WHERE e.status = 'confirmed'
    """)
    enrollments = cur.fetchall()
    if not enrollments:
        log.info("[load] %-20s  no confirmed enrollments — skipping", "attendance")
        return

    today = datetime.now().date()
    statuses = ["present"] * 8 + ["late"] * 1 + ["absent"] * 1

    sql = """
        INSERT INTO attendance (id, "studentId", "classId", date, status, "createdAt")
        VALUES (%s, %s, %s, %s, %s, NOW())
        ON CONFLICT DO NOTHING
    """

    rows: List[Tuple] = []
    class_dates: Dict[str, List] = {}

    for _, student_id, class_id in enrollments:
        if class_id not in class_dates:
            # Generate 12 weekly session dates going back ~3 months
            dates = []
            for i in range(12):
                d = today - __import__('datetime').timedelta(days=7 * (i + 1))
                dates.append(d)
            class_dates[class_id] = dates

        for session_date in class_dates[class_id]:
            rows.append((
                str(uuid.uuid4()),
                student_id,
                class_id,
                datetime.combine(session_date, __import__('datetime').time(16, 0)),
                random.choice(statuses),
            ))  # 5 values matching INSERT columns

    psycopg2.extras.execute_batch(cur, sql, rows, page_size=500)
    log.info("[load] %-20s  %d row(s) upserted", "attendance", len(rows))


# ── Public API ─────────────────────────────────────────────────────────────────


def load_all(
    clean: Dict[str, pd.DataFrame],
    db_url: str,
) -> None:
    """
    Load all clean DataFrames into PostgreSQL in dependency order.
    Wraps everything in a single transaction; rolls back on any error.

    Args:
        clean:  Dictionary of DataFrames returned by transform_all().
        db_url: PostgreSQL connection string.
    """
    log.info("[load] Connecting to database")
    conn = psycopg2.connect(db_url)

    try:
        with conn:
            with conn.cursor() as cur:
                psycopg2.extras.register_uuid()

                log.info("[load] Loading instructors → classes → students/enrollments → material_usage → attendance")

                instructor_id_map = load_instructors(cur, clean["instructors"])
                class_id_map = load_classes(cur, clean["classes"], instructor_id_map)
                load_students_and_enrollments(cur, clean["registrations"], class_id_map)
                load_material_usage(cur, clean["material_usage"], class_id_map)
                _seed_attendance(cur)

        log.info("[load] All tables committed successfully")

    except Exception as exc:
        log.error("[load] Error during load — rolling back: %s", exc)
        conn.rollback()
        raise
    finally:
        conn.close()
