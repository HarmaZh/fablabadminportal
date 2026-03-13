"""
etl/transform.py
----------------
Transformation layer for the FabLab ETL pipeline.

Each public function is a pure, independently-testable transformation that
accepts a DataFrame and returns a cleaned DataFrame.  The pipeline calls them
in sequence; each step logs before/after row counts so data loss is auditable.

Transformations applied:
  1. standardize_names      — strip whitespace, title-case
  2. clean_emails           — strip whitespace, lowercase, regex-validate
  3. normalize_dates        — parse ISO / US / long-form date strings → datetime
  4. deduplicate_registrations — same (name, class_id) → keep earliest
  5. flag_incomplete_records  — missing email or phone → status = "incomplete"
  6. calculate_derived_fields — enrollment counts, material totals, cost estimates

Usage:
    from etl.transform import transform_all
    clean = transform_all(raw_dfs)
"""

import logging
import re
from typing import Any, Dict, Optional

import pandas as pd

log = logging.getLogger(__name__)

# ── Material unit costs (USD) ──────────────────────────────────────────────────
UNIT_COSTS: Dict[str, float] = {
    "PLA Filament": 0.05,      # per gram
    "Resin": 0.08,             # per ml
    "Acrylic Sheets": 3.00,    # per sheet
    "Plywood Sheets": 2.50,    # per sheet
    "Drone Batteries": 12.00,  # per unit
    "Sphero Robots": 0.00,     # reused, no consumable cost
    "Chocolate Molds": 2.00,   # per unit
    "Chocolate": 0.02,         # per gram
    "Slime Glue": 0.02,        # per ml
    "Slime Activator": 0.03,   # per ml
    "Drawing Tablets": 0.00,   # reused
}

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")

# Date formats to try when normalising dates
DATE_FORMATS = [
    "%Y-%m-%d",       # ISO:  2024-03-15
    "%m/%d/%Y",       # US:   03/15/2024
    "%B %d, %Y",      # Long: March 15, 2024
]


# ── 1. Name standardisation ────────────────────────────────────────────────────


def standardize_names(df: pd.DataFrame, col: str = "student_name") -> pd.DataFrame:
    """Strip whitespace and apply title-case to a name column."""
    if col not in df.columns:
        return df
    before = df[col].copy()
    df = df.copy()
    df[col] = df[col].str.strip().str.title()
    changed = (before != df[col]).sum()
    log.debug("[transform] standardize_names: %d values normalised", changed)
    return df


def standardize_instructor_names(df: pd.DataFrame) -> pd.DataFrame:
    """Standardise the 'name' column in the instructors DataFrame."""
    return standardize_names(df, col="name")


# ── 2. Email cleaning ──────────────────────────────────────────────────────────


def clean_emails(df: pd.DataFrame, col: str = "email") -> pd.DataFrame:
    """Strip whitespace, lowercase, and validate email format."""
    if col not in df.columns:
        return df
    df = df.copy()
    original_count = len(df)

    df[col] = df[col].str.strip().str.lower()

    # Flag rows with non-empty but invalid email
    invalid_mask = (df[col] != "") & (~df[col].str.match(EMAIL_REGEX, na=False))
    if invalid_mask.any():
        log.warning(
            "[transform] clean_emails: %d invalid email(s) found — setting to empty",
            invalid_mask.sum(),
        )
        df.loc[invalid_mask, col] = ""

    log.debug("[transform] clean_emails: processed %d rows", original_count)
    return df


def validate_email(email: str) -> bool:
    """Return True if the email string passes the format check."""
    return bool(EMAIL_REGEX.match(email.strip().lower())) if email else False


# ── 3. Date normalisation ──────────────────────────────────────────────────────


def _parse_date(value: Any) -> Optional[pd.Timestamp]:
    """Try each known date format and return a Timestamp or None."""
    if pd.isna(value) or str(value).strip() == "":
        return None
    for fmt in DATE_FORMATS:
        try:
            return pd.to_datetime(str(value).strip(), format=fmt)
        except (ValueError, TypeError):
            continue
    # Last resort: let pandas guess
    try:
        return pd.to_datetime(str(value).strip(), infer_datetime_format=True)
    except Exception:
        return None


def normalize_dates(df: pd.DataFrame, col: str) -> pd.DataFrame:
    """Parse inconsistent date strings into pandas Timestamps."""
    if col not in df.columns:
        return df
    df = df.copy()
    before_nulls = df[col].isna().sum()
    df[col] = df[col].apply(_parse_date)
    after_nulls = df[col].isna().sum()
    new_nulls = after_nulls - before_nulls
    if new_nulls > 0:
        log.warning(
            "[transform] normalize_dates(%s): %d value(s) could not be parsed → NaT",
            col,
            new_nulls,
        )
    log.debug("[transform] normalize_dates(%s): %d rows processed", col, len(df))
    return df


# ── 4. Deduplication ───────────────────────────────────────────────────────────


def deduplicate_registrations(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove duplicate registrations.

    A duplicate is defined as the same (student_name, class_id) pair after
    names have already been standardised.  The earliest registration_date is
    kept; the rest are dropped.
    """
    before = len(df)
    df = df.copy()
    df = df.sort_values("registration_date", na_position="last")
    df = df.drop_duplicates(subset=["student_name", "class_id"], keep="first")
    removed = before - len(df)
    log.info("[transform] deduplicate_registrations: removed %d duplicate(s)", removed)
    return df.reset_index(drop=True)


# ── 5. Incomplete record flagging ──────────────────────────────────────────────


def flag_incomplete_records(df: pd.DataFrame) -> pd.DataFrame:
    """
    Mark registrations missing an email or phone as 'incomplete'.

    Records that are already 'cancelled' are left unchanged.
    """
    df = df.copy()
    incomplete_mask = (
        (df.get("email", pd.Series(["a"] * len(df))) == "")
        | (df.get("phone", pd.Series(["a"] * len(df))) == "")
    ) & (df.get("status", pd.Series([""] * len(df))) != "cancelled")

    flagged = incomplete_mask.sum()
    df.loc[incomplete_mask, "status"] = "incomplete"
    log.info("[transform] flag_incomplete_records: %d record(s) marked incomplete", flagged)
    return df


# ── 6. Derived fields ──────────────────────────────────────────────────────────


def calculate_derived_fields(
    registrations: pd.DataFrame,
    material_usage: pd.DataFrame,
) -> Dict[str, pd.DataFrame]:
    """
    Compute summary DataFrames used by the Streamlit dashboard and Power BI.

    Returns:
        {
          "enrollment_counts": df with class_id → confirmed_count,
          "material_totals":   df with class_id + material → total_qty + cost,
        }
    """
    # Enrollment counts per class (confirmed only)
    confirmed = registrations[registrations["status"] == "confirmed"]
    enrollment_counts = (
        confirmed.groupby("class_id")
        .size()
        .reset_index(name="confirmed_count")
    )

    # Material totals + cost estimates
    mu = material_usage.copy()
    mu["quantity_used"] = pd.to_numeric(mu["quantity_used"], errors="coerce").fillna(0)
    mu["unit_cost"] = mu["material_name"].map(UNIT_COSTS).fillna(0.0)
    mu["estimated_cost"] = mu["quantity_used"] * mu["unit_cost"]

    material_totals = (
        mu.groupby(["class_id", "material_name", "unit"])
        .agg(
            total_quantity=("quantity_used", "sum"),
            total_cost=("estimated_cost", "sum"),
            session_count=("session_date", "count"),
        )
        .reset_index()
    )

    log.info(
        "[transform] calculate_derived_fields: %d class enrollment summaries, %d material summaries",
        len(enrollment_counts),
        len(material_totals),
    )
    return {
        "enrollment_counts": enrollment_counts,
        "material_totals": material_totals,
    }


# ── Data quality report ────────────────────────────────────────────────────────


def data_quality_report(
    raw_registrations: pd.DataFrame,
    clean_registrations: pd.DataFrame,
) -> None:
    """Print a human-readable data quality summary to the log."""
    removed = len(raw_registrations) - len(clean_registrations)
    incomplete = (clean_registrations.get("status") == "incomplete").sum()
    cancelled = (clean_registrations.get("status") == "cancelled").sum()
    confirmed = (clean_registrations.get("status") == "confirmed").sum()

    log.info("=" * 55)
    log.info("DATA QUALITY REPORT")
    log.info("=" * 55)
    log.info("  Raw records       : %d", len(raw_registrations))
    log.info("  Clean records     : %d", len(clean_registrations))
    log.info("  Duplicates removed: %d", removed)
    log.info("  Confirmed         : %d", confirmed)
    log.info("  Incomplete        : %d", incomplete)
    log.info("  Cancelled         : %d", cancelled)
    log.info("=" * 55)


# ── Orchestrator ───────────────────────────────────────────────────────────────


def transform_all(
    raw: dict[str, pd.DataFrame],
) -> Dict[str, pd.DataFrame]:
    """
    Run the full transformation sequence on raw DataFrames extracted from
    the source (CSV or Google Sheets).

    Returns a dictionary of clean DataFrames ready for loading into PostgreSQL.
    """
    log.info("[transform] Starting transformation pipeline")

    instructors = raw["instructors"].copy()
    classes = raw["classes"].copy()
    registrations = raw["registrations"].copy()
    material_usage = raw["material_usage"].copy()

    raw_reg_count = len(registrations)

    # ── Instructors ────────────────────────────────────────────────────────────
    instructors = standardize_instructor_names(instructors)
    instructors = clean_emails(instructors, col="email")

    # ── Registrations ──────────────────────────────────────────────────────────
    registrations = standardize_names(registrations, col="student_name")
    registrations = clean_emails(registrations, col="email")
    registrations = normalize_dates(registrations, col="registration_date")
    registrations = deduplicate_registrations(registrations)
    registrations = flag_incomplete_records(registrations)

    # ── Material usage ─────────────────────────────────────────────────────────
    material_usage = normalize_dates(material_usage, col="session_date")

    # ── Derived fields (summaries) ─────────────────────────────────────────────
    derived = calculate_derived_fields(registrations, material_usage)

    data_quality_report(pd.DataFrame(index=range(raw_reg_count)), registrations)

    log.info("[transform] Transformation complete")

    return {
        "instructors": instructors,
        "classes": classes,
        "registrations": registrations,
        "material_usage": material_usage,
        "enrollment_counts": derived["enrollment_counts"],
        "material_totals": derived["material_totals"],
    }
