"""
etl/run_pipeline.py
-------------------
Orchestrator for the FabLab ETL pipeline.

Runs the full Extract → Transform → Load sequence and prints a timing summary.
Exits with a non-zero code if any step fails.

Usage:
    python etl/run_pipeline.py                # mock mode  → local Docker DB
    python etl/run_pipeline.py --live         # Google Sheets → local Docker DB
    python etl/run_pipeline.py --seed         # seed CSVs first, then run (mock mode)
    python etl/run_pipeline.py --cloud        # mock mode  → cloud DB (Supabase/Neon)
    python etl/run_pipeline.py --seed --cloud # seed + load into cloud DB
"""

import argparse
import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, Tuple

# Ensure project root is on sys.path so `etl` and `config` are importable
# when running as `python etl/run_pipeline.py` from any directory.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def _step(name: str, fn, *args, **kwargs) -> Tuple[Any, float]:
    """Run a pipeline step, time it, and re-raise on failure."""
    log.info("━" * 55)
    log.info("▶  %s", name)
    t0 = time.perf_counter()
    try:
        result = fn(*args, **kwargs)
    except Exception as exc:
        log.error("✖  %s FAILED: %s", name, exc)
        raise
    elapsed = time.perf_counter() - t0
    log.info("✔  %s  (%.2fs)", name, elapsed)
    return result, elapsed


def main() -> None:
    parser = argparse.ArgumentParser(description="FabLab ETL pipeline orchestrator")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Use Google Sheets as the data source (requires credentials)",
    )
    parser.add_argument(
        "--seed",
        action="store_true",
        help="Generate fresh seed data before running the pipeline",
    )
    parser.add_argument(
        "--cloud",
        action="store_true",
        help="Load into cloud PostgreSQL (CLOUD_DATABASE_URL) instead of local Docker",
    )
    args = parser.parse_args()

    pipeline_start = time.perf_counter()
    timings: Dict[str, float] = {}

    log.info("=" * 55)
    log.info("  FabLab ETL Pipeline")
    log.info("  mode   : %s", "live (Google Sheets)" if args.live else "mock (CSV)")
    log.info("  target : %s", "cloud DB" if args.cloud else "local Docker DB")
    log.info("=" * 55)

    # ── 0. Optional seed ──────────────────────────────────────────────────────
    if args.seed:
        from etl.seed_data import main as seed_main
        _, timings["seed"] = _step("Seed data generation", seed_main)

    # ── 1. Extract ────────────────────────────────────────────────────────────
    from etl.extract import extract
    mode = "live" if args.live else "mock"
    raw_dfs, timings["extract"] = _step("Extract", extract, mode=mode)

    # ── 2. Transform ──────────────────────────────────────────────────────────
    from etl.transform import transform_all
    clean_dfs, timings["transform"] = _step("Transform", transform_all, raw_dfs)

    # ── 3. Load ───────────────────────────────────────────────────────────────
    from config.settings import settings
    from etl.load import load_all

    db_url = settings.get_database_url(cloud=args.cloud)
    _, timings["load"] = _step("Load", load_all, clean_dfs, db_url)

    # ── Summary ───────────────────────────────────────────────────────────────
    total = time.perf_counter() - pipeline_start
    log.info("=" * 55)
    log.info("  PIPELINE COMPLETE")
    log.info("  Total runtime : %.2fs", total)
    for step, t in timings.items():
        log.info("    %-12s  %.2fs", step, t)
    log.info("")
    log.info("  Records loaded:")
    log.info("    Instructors  : %d", len(clean_dfs["instructors"]))
    log.info("    Classes      : %d", len(clean_dfs["classes"]))
    log.info("    Registrations: %d", len(clean_dfs["registrations"]))
    log.info("    Mat. usage   : %d", len(clean_dfs["material_usage"]))
    log.info("=" * 55)

    if args.cloud:
        log.info("Data is now in your cloud PostgreSQL database.")
        log.info("Connect Power BI web to it via Get Data → PostgreSQL.")


if __name__ == "__main__":
    try:
        main()
    except Exception as _exc:
        log.exception("Pipeline failed: %s", _exc)
        sys.exit(1)
