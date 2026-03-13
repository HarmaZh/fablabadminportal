"""
tests/conftest.py
-----------------
Shared pytest fixtures for FabLab ETL tests.
"""

import pytest
import pandas as pd
from datetime import datetime


@pytest.fixture
def sample_registrations() -> pd.DataFrame:
    """A small, controlled DataFrame for transformation unit tests."""
    return pd.DataFrame(
        {
            "student_name": [
                "john smith",
                "JANE DOE",
                "  Alice Johnson  ",
                "bob williams",
                "john smith",  # duplicate of row 0
            ],
            "email": [
                "  john@example.com  ",
                "JANE@EXAMPLE.COM",
                "alice@example.com",
                "",  # missing → incomplete
                "john@example.com",
            ],
            "phone": ["555-1234", "555-5678", "555-9012", "555-3456", "555-1234"],
            "parent_name": ["", "", "", "", ""],
            "class_id": ["CLS-001", "CLS-002", "CLS-003", "CLS-001", "CLS-001"],
            "registration_date": [
                "2024-03-15",
                "03/20/2024",
                "April 01, 2024",
                "2024-04-10",
                "2024-03-20",  # later date → should be removed as duplicate
            ],
            "status": ["confirmed", "confirmed", "confirmed", "confirmed", "confirmed"],
        }
    )


@pytest.fixture
def sample_material_usage() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "class_id": ["CLS-001", "CLS-003", "CLS-004"],
            "instructor": ["James Okafor", "David Chen", "Maria Gonzalez"],
            "material_name": ["Slime Glue", "Acrylic Sheets", "PLA Filament"],
            "quantity_used": ["150.0", "3.0", "200.0"],
            "unit": ["ml", "sheets", "grams"],
            "session_date": ["2024-03-15", "2024-03-22", "2024-04-01"],
            "notes": ["", "High school session", ""],
        }
    )
