"""
tests/test_transform.py
-----------------------
Unit tests for every transformation function in etl/transform.py.
No database connection required — all tests use in-memory DataFrames.

Run with:
    pytest tests/test_transform.py -v
"""

import pandas as pd
import pytest

from etl.transform import (
    calculate_derived_fields,
    clean_emails,
    deduplicate_registrations,
    flag_incomplete_records,
    normalize_dates,
    standardize_names,
    validate_email,
)


# ── standardize_names ──────────────────────────────────────────────────────────


class TestStandardizeNames:
    def test_lowercased_name_becomes_title_case(self, sample_registrations):
        result = standardize_names(sample_registrations)
        assert result["student_name"].iloc[0] == "John Smith"

    def test_all_caps_becomes_title_case(self, sample_registrations):
        result = standardize_names(sample_registrations)
        assert result["student_name"].iloc[1] == "Jane Doe"

    def test_leading_trailing_whitespace_stripped(self, sample_registrations):
        result = standardize_names(sample_registrations)
        assert result["student_name"].iloc[2] == "Alice Johnson"

    def test_no_mutation_of_original(self, sample_registrations):
        original = sample_registrations.copy()
        standardize_names(sample_registrations)
        pd.testing.assert_frame_equal(sample_registrations, original)

    def test_missing_column_returns_unchanged(self, sample_registrations):
        df = sample_registrations.drop(columns=["student_name"])
        result = standardize_names(df)  # should not raise
        assert "student_name" not in result.columns


# ── clean_emails ───────────────────────────────────────────────────────────────


class TestCleanEmails:
    def test_strips_whitespace(self, sample_registrations):
        result = clean_emails(sample_registrations)
        assert result["email"].iloc[0] == "john@example.com"

    def test_lowercases_email(self, sample_registrations):
        result = clean_emails(sample_registrations)
        assert result["email"].iloc[1] == "jane@example.com"

    def test_invalid_email_cleared(self):
        df = pd.DataFrame({"email": ["not-an-email", "valid@test.com", ""]})
        result = clean_emails(df)
        assert result["email"].iloc[0] == ""
        assert result["email"].iloc[1] == "valid@test.com"
        assert result["email"].iloc[2] == ""

    def test_empty_email_stays_empty(self, sample_registrations):
        result = clean_emails(sample_registrations)
        assert result["email"].iloc[3] == ""


class TestValidateEmail:
    def test_valid_email_returns_true(self):
        assert validate_email("alice@example.com") is True

    def test_email_with_spaces_returns_false(self):
        assert validate_email("al ice@example.com") is False

    def test_empty_string_returns_false(self):
        assert validate_email("") is False

    def test_missing_at_symbol_returns_false(self):
        assert validate_email("notanemail.com") is False

    def test_subdomain_email_returns_true(self):
        assert validate_email("user@mail.example.co.uk") is True


# ── normalize_dates ────────────────────────────────────────────────────────────


class TestNormalizeDates:
    def test_iso_format_parsed(self, sample_registrations):
        result = normalize_dates(sample_registrations, "registration_date")
        assert pd.notna(result["registration_date"].iloc[0])
        assert result["registration_date"].iloc[0].year == 2024
        assert result["registration_date"].iloc[0].month == 3
        assert result["registration_date"].iloc[0].day == 15

    def test_us_format_parsed(self, sample_registrations):
        result = normalize_dates(sample_registrations, "registration_date")
        dt = result["registration_date"].iloc[1]
        assert dt.month == 3 and dt.day == 20

    def test_long_format_parsed(self, sample_registrations):
        result = normalize_dates(sample_registrations, "registration_date")
        dt = result["registration_date"].iloc[2]
        assert dt.month == 4 and dt.day == 1

    def test_missing_column_returns_unchanged(self, sample_registrations):
        result = normalize_dates(sample_registrations, "nonexistent_col")
        assert "nonexistent_col" not in result.columns


# ── deduplicate_registrations ──────────────────────────────────────────────────


class TestDeduplicateRegistrations:
    def test_duplicate_removed(self, sample_registrations):
        df = standardize_names(sample_registrations)
        df = clean_emails(df)
        df = normalize_dates(df, "registration_date")
        result = deduplicate_registrations(df)
        # Row 0 and row 4 are both "John Smith" in "CLS-001"
        john_cls001 = result[
            (result["student_name"] == "John Smith") & (result["class_id"] == "CLS-001")
        ]
        assert len(john_cls001) == 1

    def test_earliest_registration_kept(self, sample_registrations):
        df = standardize_names(sample_registrations)
        df = clean_emails(df)
        df = normalize_dates(df, "registration_date")
        result = deduplicate_registrations(df)
        john = result[
            (result["student_name"] == "John Smith") & (result["class_id"] == "CLS-001")
        ].iloc[0]
        assert john["registration_date"].day == 15  # March 15, not March 20

    def test_non_duplicates_preserved(self, sample_registrations):
        df = standardize_names(sample_registrations)
        df = clean_emails(df)
        df = normalize_dates(df, "registration_date")
        result = deduplicate_registrations(df)
        # Should have 4 rows (5 - 1 duplicate)
        assert len(result) == 4

    def test_empty_dataframe_returns_empty(self):
        df = pd.DataFrame(columns=["student_name", "class_id", "registration_date"])
        result = deduplicate_registrations(df)
        assert len(result) == 0


# ── flag_incomplete_records ────────────────────────────────────────────────────


class TestFlagIncompleteRecords:
    def test_missing_email_flagged(self, sample_registrations):
        result = flag_incomplete_records(sample_registrations)
        # Row 3 has empty email
        assert result["status"].iloc[3] == "incomplete"

    def test_confirmed_rows_unchanged(self, sample_registrations):
        result = flag_incomplete_records(sample_registrations)
        assert result["status"].iloc[0] == "confirmed"
        assert result["status"].iloc[1] == "confirmed"

    def test_cancelled_not_overwritten(self):
        df = pd.DataFrame(
            {
                "email": [""],
                "phone": [""],
                "status": ["cancelled"],
            }
        )
        result = flag_incomplete_records(df)
        assert result["status"].iloc[0] == "cancelled"

    def test_missing_phone_flagged(self):
        df = pd.DataFrame(
            {
                "email": ["valid@test.com"],
                "phone": [""],
                "status": ["confirmed"],
            }
        )
        result = flag_incomplete_records(df)
        assert result["status"].iloc[0] == "incomplete"


# ── calculate_derived_fields ───────────────────────────────────────────────────


class TestCalculateDerivedFields:
    def test_enrollment_count_per_class(self, sample_registrations, sample_material_usage):
        df = sample_registrations.copy()
        df["status"] = "confirmed"
        result = calculate_derived_fields(df, sample_material_usage)
        counts = result["enrollment_counts"].set_index("class_id")["confirmed_count"]
        assert counts["CLS-001"] == 3  # rows 0, 3, and 4

    def test_material_totals_computed(self, sample_registrations, sample_material_usage):
        result = calculate_derived_fields(sample_registrations, sample_material_usage)
        totals = result["material_totals"]
        assert "total_quantity" in totals.columns
        assert "total_cost" in totals.columns

    def test_cost_estimate_correct(self, sample_registrations, sample_material_usage):
        result = calculate_derived_fields(sample_registrations, sample_material_usage)
        slime_row = result["material_totals"][
            result["material_totals"]["material_name"] == "Slime Glue"
        ].iloc[0]
        # 150 ml × $0.02/ml = $3.00
        assert abs(slime_row["total_cost"] - 3.00) < 0.01
