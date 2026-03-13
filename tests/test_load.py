"""
tests/test_load.py
------------------
Integration tests for etl/load.py.

These tests require a running PostgreSQL instance with the FabLab schema
already created (Prisma migrations applied).  Set TEST_DATABASE_URL in your
environment or .env to point to a test database.

Run with:
    pytest tests/test_load.py -v

Skip if no database is available:
    pytest tests/test_load.py -v -m "not integration"
"""

import os
import uuid

import pandas as pd
import psycopg2
import pytest

# ── Fixtures ───────────────────────────────────────────────────────────────────

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://fablab_user:fablab_password@localhost:5432/fablab_db",
)


def _db_available() -> bool:
    try:
        conn = psycopg2.connect(TEST_DB_URL, connect_timeout=3)
        conn.close()
        return True
    except Exception:
        return False


skip_no_db = pytest.mark.skipif(
    not _db_available(),
    reason="PostgreSQL not available — start Docker with `docker compose up -d`",
)


@pytest.fixture(scope="module")
def db_conn():
    """Module-scoped DB connection for integration tests."""
    conn = psycopg2.connect(TEST_DB_URL)
    conn.autocommit = False
    yield conn
    conn.close()


@pytest.fixture
def minimal_clean_dfs() -> dict[str, pd.DataFrame]:
    """Minimal DataFrames that satisfy the load_all() contract."""
    uid = uuid.uuid4().hex[:6].upper()
    return {
        "instructors": pd.DataFrame(
            [
                {
                    "instructor_id": f"STF-TEST-{uid}",
                    "name": f"Test Instructor {uid}",
                    "email": f"instructor_{uid.lower()}@fablab.org",
                    "role": "INSTRUCTOR",
                    "specialization": "Testing",
                    "phone": "555-0000",
                }
            ]
        ),
        "classes": pd.DataFrame(
            [
                {
                    "class_id": f"CLS-TEST-{uid}",
                    "class_name": f"Test Class {uid}",
                    "description": "Integration test class",
                    "age_group": "All Ages",
                    "schedule_description": "One-off",
                    "is_recurring": False,
                    "color": "#6366f1",
                    "instructor": f"Test Instructor {uid}",
                    "max_students": 10,
                }
            ]
        ),
        "registrations": pd.DataFrame(
            [
                {
                    "student_name": f"Test Student {uid}",
                    "email": f"student_{uid.lower()}@example.com",
                    "phone": "555-1234",
                    "parent_name": "",
                    "class_id": f"CLS-TEST-{uid}",
                    "registration_date": pd.Timestamp("2024-06-01"),
                    "status": "confirmed",
                }
            ]
        ),
        "material_usage": pd.DataFrame(
            [
                {
                    "class_id": f"CLS-TEST-{uid}",
                    "instructor": f"Test Instructor {uid}",
                    "material_name": "PLA Filament",
                    "quantity_used": 100.0,
                    "unit": "grams",
                    "session_date": pd.Timestamp("2024-06-01"),
                    "notes": "",
                }
            ]
        ),
        "enrollment_counts": pd.DataFrame(),
        "material_totals": pd.DataFrame(),
    }


# ── Tests ──────────────────────────────────────────────────────────────────────


@skip_no_db
class TestLoadIdempotency:
    """Running the pipeline twice should yield the same row counts."""

    def test_upsert_is_idempotent(self, minimal_clean_dfs):
        from etl.load import load_all

        # First run
        load_all(minimal_clean_dfs, TEST_DB_URL)

        conn = psycopg2.connect(TEST_DB_URL)
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM staff WHERE name LIKE 'Test Instructor%'")
            count_after_first = cur.fetchone()[0]

        # Second run — identical data
        load_all(minimal_clean_dfs, TEST_DB_URL)

        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM staff WHERE name LIKE 'Test Instructor%'")
            count_after_second = cur.fetchone()[0]

        conn.close()
        assert count_after_first == count_after_second, (
            "Running load twice should not create duplicate rows"
        )

    def test_enrollment_count_stable_after_two_runs(self, minimal_clean_dfs):
        from etl.load import load_all

        load_all(minimal_clean_dfs, TEST_DB_URL)
        load_all(minimal_clean_dfs, TEST_DB_URL)

        conn = psycopg2.connect(TEST_DB_URL)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) FROM enrollments e
                JOIN students s ON e."studentId" = s.id
                WHERE s.name LIKE 'Test Student%'
                """
            )
            count = cur.fetchone()[0]
        conn.close()

        assert count == 1, f"Expected 1 enrollment record, got {count}"


@skip_no_db
class TestForeignKeyIntegrity:
    """All loaded rows should satisfy foreign-key constraints."""

    def test_all_enrollments_reference_valid_class(self):
        conn = psycopg2.connect(TEST_DB_URL)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) FROM enrollments e
                LEFT JOIN classes c ON e."classId" = c.id
                WHERE c.id IS NULL
                """
            )
            orphans = cur.fetchone()[0]
        conn.close()
        assert orphans == 0, f"{orphans} enrollment(s) reference a non-existent class"

    def test_all_enrollments_reference_valid_student(self):
        conn = psycopg2.connect(TEST_DB_URL)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) FROM enrollments e
                LEFT JOIN students s ON e."studentId" = s.id
                WHERE s.id IS NULL
                """
            )
            orphans = cur.fetchone()[0]
        conn.close()
        assert orphans == 0, f"{orphans} enrollment(s) reference a non-existent student"

    def test_all_material_usage_references_valid_class(self):
        conn = psycopg2.connect(TEST_DB_URL)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) FROM material_usage mu
                LEFT JOIN classes c ON mu."classId" = c.id
                WHERE c.id IS NULL
                """
            )
            orphans = cur.fetchone()[0]
        conn.close()
        assert orphans == 0, f"{orphans} material_usage row(s) reference a non-existent class"
