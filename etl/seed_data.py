"""
etl/seed_data.py
----------------
Generates realistic, intentionally messy sample data for the FabLab ETL
pipeline using the Faker library. Output CSVs are written to data/raw/ and
simulate what would come from Google Forms registrations.

Messiness introduced (so the transform step has real work to do):
  - Mixed-case names  ("john smith", "JOHN SMITH", "John Smith")
  - Extra whitespace in emails ("  alice@example.com  ")
  - Three different date formats ("2024-03-15", "03/15/2024", "March 15, 2024")
  - ~5 % duplicate registrations (same name + class)
  - ~10 % incomplete records (missing email or phone)
  - ~5 % cancelled registrations

Usage:
    python etl/seed_data.py
"""

import logging
import random
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
from faker import Faker

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
log = logging.getLogger(__name__)

fake = Faker(["en_US"])
random.seed(42)
Faker.seed(42)

# ── Constants ──────────────────────────────────────────────────────────────────

CLASSES = [
    {
        "class_id": "CLS-001",
        "class_name": "Tacoma Middle School Monthly Engineering Workshop",
        "description": "Hands-on engineering challenges for middle schoolers using slime, circuits, and creative problem-solving.",
        "age_group": "Youth 6th-9th",
        "schedule_description": "First Tuesday of the Month",
        "is_recurring": True,
    },
    {
        "class_id": "CLS-002",
        "class_name": "Youth Anime Monthly Workshop",
        "description": "Students design and draw anime characters using drawing tablets and digital art software.",
        "age_group": "Youth 6th-9th",
        "schedule_description": "First Friday of the Month",
        "is_recurring": True,
    },
    {
        "class_id": "CLS-003",
        "class_name": "Introduction to Lasers with Glowforge",
        "description": "Learn to use the Glowforge laser cutter to engrave and cut custom designs on wood and acrylic.",
        "age_group": "All Ages",
        "schedule_description": "One-off sessions",
        "is_recurring": False,
    },
    {
        "class_id": "CLS-004",
        "class_name": "Intro to 3D Printing for Kids",
        "description": "Young makers design and print their first 3D objects using Tinkercad and our Bambu Lab printers.",
        "age_group": "Youth K-5th",
        "schedule_description": "One-off sessions",
        "is_recurring": False,
    },
    {
        "class_id": "CLS-005",
        "class_name": "High School Art and Laser Workshop",
        "description": "High schoolers create original art pieces using the laser cutter, combining digital design with physical materials.",
        "age_group": "High School 9th-12th",
        "schedule_description": "Last Tuesday of the Month",
        "is_recurring": True,
    },
    {
        "class_id": "CLS-006",
        "class_name": "Drone Piloting Basics",
        "description": "Introduction to drone safety, regulations, and hands-on flying practice in our indoor course.",
        "age_group": "Youth 6th-9th",
        "schedule_description": "One-off sessions",
        "is_recurring": False,
    },
    {
        "class_id": "CLS-007",
        "class_name": "Sphero Robotics Challenge",
        "description": "Program Sphero robots to navigate obstacle courses and complete challenges using block-based coding.",
        "age_group": "Youth K-5th",
        "schedule_description": "One-off sessions",
        "is_recurring": False,
    },
    {
        "class_id": "CLS-008",
        "class_name": "Chocolate Making with Tech",
        "description": "Participants design custom chocolate molds, then use the chocolate melter to create their own treats.",
        "age_group": "All Ages",
        "schedule_description": "One-off sessions",
        "is_recurring": False,
    },
]

# Materials mapped to relevant classes
CLASS_MATERIALS: dict[str, list[dict]] = {
    "CLS-001": [
        {"material_name": "Slime Glue", "unit": "ml", "cost_per_unit": 0.02},
        {"material_name": "Slime Activator", "unit": "ml", "cost_per_unit": 0.03},
    ],
    "CLS-002": [
        {"material_name": "Drawing Tablets", "unit": "units", "cost_per_unit": 0.0},
    ],
    "CLS-003": [
        {"material_name": "Acrylic Sheets", "unit": "sheets", "cost_per_unit": 3.0},
        {"material_name": "Plywood Sheets", "unit": "sheets", "cost_per_unit": 2.5},
    ],
    "CLS-004": [
        {"material_name": "PLA Filament", "unit": "grams", "cost_per_unit": 0.05},
        {"material_name": "Resin", "unit": "ml", "cost_per_unit": 0.08},
    ],
    "CLS-005": [
        {"material_name": "Acrylic Sheets", "unit": "sheets", "cost_per_unit": 3.0},
        {"material_name": "Plywood Sheets", "unit": "sheets", "cost_per_unit": 2.5},
    ],
    "CLS-006": [
        {"material_name": "Drone Batteries", "unit": "units", "cost_per_unit": 12.0},
    ],
    "CLS-007": [
        {"material_name": "Sphero Robots", "unit": "units", "cost_per_unit": 0.0},
    ],
    "CLS-008": [
        {"material_name": "Chocolate Molds", "unit": "units", "cost_per_unit": 2.0},
        {"material_name": "Chocolate", "unit": "grams", "cost_per_unit": 0.02},
    ],
}

INSTRUCTOR_NAMES = [
    "Maria Gonzalez",
    "David Chen",
    "Sarah Johnson",
    "James Okafor",
    "Emily Nakamura",
    "Carlos Rivera",
]

INSTRUCTOR_SPECIALIZATIONS = {
    "Maria Gonzalez": "3D Printing & Fabrication",
    "David Chen": "Laser Cutting & Digital Design",
    "Sarah Johnson": "Robotics & Electronics",
    "James Okafor": "Engineering Workshops",
    "Emily Nakamura": "Digital Art & Animation",
    "Carlos Rivera": "Drones & Aviation",
}

# Map classes to their primary instructor
CLASS_INSTRUCTORS: dict[str, str] = {
    "CLS-001": "James Okafor",
    "CLS-002": "Emily Nakamura",
    "CLS-003": "David Chen",
    "CLS-004": "Maria Gonzalez",
    "CLS-005": "David Chen",
    "CLS-006": "Carlos Rivera",
    "CLS-007": "Sarah Johnson",
    "CLS-008": "Maria Gonzalez",
}

CLASS_COLORS = {
    "CLS-001": "#6366f1",
    "CLS-002": "#ec4899",
    "CLS-003": "#f59e0b",
    "CLS-004": "#10b981",
    "CLS-005": "#8b5cf6",
    "CLS-006": "#0ea5e9",
    "CLS-007": "#f97316",
    "CLS-008": "#d97706",
}

# ── Helper utilities ───────────────────────────────────────────────────────────


def _messy_name(name: str) -> str:
    """Randomly mangle a name to simulate real-world input inconsistency."""
    roll = random.random()
    if roll < 0.25:
        return name.lower()
    if roll < 0.45:
        return name.upper()
    if roll < 0.55:
        return name.title() + "  "  # trailing spaces
    return name  # correct


def _messy_email(email: str) -> str:
    """Randomly add whitespace or capitalisation errors to an email."""
    roll = random.random()
    if roll < 0.15:
        return f"  {email}  "
    if roll < 0.25:
        return email.upper()
    return email


def _messy_date(dt: datetime) -> str:
    """Format a date in one of three inconsistent formats."""
    fmt = random.choice(["iso", "us", "long"])
    if fmt == "iso":
        return dt.strftime("%Y-%m-%d")
    if fmt == "us":
        return dt.strftime("%m/%d/%Y")
    return dt.strftime("%B %d, %Y")


def _random_past_date(days_back: int = 180) -> datetime:
    return datetime.now() - timedelta(days=random.randint(0, days_back))


# ── Generator functions ────────────────────────────────────────────────────────


def generate_instructors() -> pd.DataFrame:
    rows = []
    for i, name in enumerate(INSTRUCTOR_NAMES, start=1):
        first, last = name.split(" ", 1)
        rows.append(
            {
                "instructor_id": f"STF-{i:03d}",
                "name": name,
                "email": f"{first.lower()}.{last.lower().replace(' ', '')}@fablab.org",
                "role": "INSTRUCTOR",
                "specialization": INSTRUCTOR_SPECIALIZATIONS[name],
                "phone": fake.phone_number(),
            }
        )
    df = pd.DataFrame(rows)
    log.info("Generated %d instructors", len(df))
    return df


def generate_classes() -> pd.DataFrame:
    rows = []
    for cls in CLASSES:
        rows.append(
            {
                **cls,
                "color": CLASS_COLORS[cls["class_id"]],
                "instructor": CLASS_INSTRUCTORS[cls["class_id"]],
                "max_students": random.randint(10, 20),
            }
        )
    df = pd.DataFrame(rows)
    log.info("Generated %d classes", len(df))
    return df


def generate_registrations(n_target: int = 175) -> pd.DataFrame:
    """
    Generate realistic registration records with intentional data quality issues.
    """
    class_ids = [c["class_id"] for c in CLASSES]
    rows: list[dict] = []

    # Weights so more popular classes get more registrations
    weights = [0.18, 0.15, 0.12, 0.14, 0.10, 0.10, 0.11, 0.10]

    for _ in range(n_target):
        class_id = random.choices(class_ids, weights=weights, k=1)[0]
        first = fake.first_name()
        last = fake.last_name()
        full_name = f"{first} {last}"
        email = fake.email()
        phone = fake.phone_number()
        reg_date = _random_past_date(180)

        # Determine status
        roll = random.random()
        if roll < 0.05:
            status = "cancelled"
        elif roll < 0.15:
            status = "incomplete"
            # Incomplete records are missing email or phone
            if random.random() < 0.5:
                email = ""
            else:
                phone = ""
        else:
            status = "confirmed"

        # Determine if youth class (needs parent name)
        cls_info = next(c for c in CLASSES if c["class_id"] == class_id)
        parent_name = (
            fake.name() if "Youth" in cls_info["age_group"] or "K-5th" in cls_info["age_group"] else ""
        )

        rows.append(
            {
                "student_name": _messy_name(full_name),
                "email": _messy_email(email) if email else "",
                "phone": phone,
                "parent_name": parent_name,
                "class_id": class_id,
                "registration_date": _messy_date(reg_date),
                "status": status,
            }
        )

    # Inject ~5 % duplicates (same name + class)
    n_dupes = max(1, int(n_target * 0.05))
    for _ in range(n_dupes):
        original = random.choice(rows)
        dupe = original.copy()
        # Slightly different date so it looks like a re-submission
        dupe["registration_date"] = _messy_date(_random_past_date(30))
        rows.append(dupe)

    df = pd.DataFrame(rows)
    log.info(
        "Generated %d registration records (%d intentional duplicates, ~%d incomplete, ~%d cancelled)",
        len(df),
        n_dupes,
        int(n_target * 0.10),
        int(n_target * 0.05),
    )
    return df


def generate_material_usage(n_target: int = 100) -> pd.DataFrame:
    rows: list[dict] = []

    for _ in range(n_target):
        class_id = random.choice(list(CLASS_MATERIALS.keys()))
        material = random.choice(CLASS_MATERIALS[class_id])
        instructor = CLASS_INSTRUCTORS[class_id]
        session_date = _random_past_date(180)

        # Realistic quantity ranges per material type
        qty_ranges = {
            "ml": (50, 500),
            "grams": (20, 300),
            "sheets": (1, 8),
            "units": (1, 6),
        }
        lo, hi = qty_ranges.get(material["unit"], (1, 10))
        quantity = round(random.uniform(lo, hi), 2)

        rows.append(
            {
                "class_id": class_id,
                "instructor": instructor,
                "material_name": material["material_name"],
                "quantity_used": quantity,
                "unit": material["unit"],
                "session_date": session_date.strftime("%Y-%m-%d"),
                "notes": fake.sentence(nb_words=6) if random.random() < 0.3 else "",
            }
        )

    df = pd.DataFrame(rows)
    log.info("Generated %d material usage records", len(df))
    return df


# ── Entry point ────────────────────────────────────────────────────────────────


def main() -> None:
    from pathlib import Path

    out_dir = Path(__file__).resolve().parent.parent / "data" / "raw"
    out_dir.mkdir(parents=True, exist_ok=True)

    instructors = generate_instructors()
    classes = generate_classes()
    registrations = generate_registrations(175)
    materials = generate_material_usage(100)

    instructors.to_csv(out_dir / "instructors.csv", index=False)
    classes.to_csv(out_dir / "classes.csv", index=False)
    registrations.to_csv(out_dir / "registrations.csv", index=False)
    materials.to_csv(out_dir / "material_usage.csv", index=False)

    log.info("Seed data written to %s", out_dir)
    log.info("  instructors.csv   : %d rows", len(instructors))
    log.info("  classes.csv       : %d rows", len(classes))
    log.info("  registrations.csv : %d rows", len(registrations))
    log.info("  material_usage.csv: %d rows", len(materials))


if __name__ == "__main__":
    main()
