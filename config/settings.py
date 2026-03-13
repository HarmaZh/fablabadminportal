"""
config/settings.py
------------------
Centralised configuration loaded from environment variables.
Supports both local Docker PostgreSQL and a cloud database (e.g. Supabase)
for Power BI integration.
"""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load .env from the project root (two levels up from this file)
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")


class Settings:
    # ── Local PostgreSQL (Docker) ──────────────────────────────────────────────
    DB_USER: str = os.getenv("POSTGRES_USER", "fablab_user")
    DB_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "fablab_password")
    DB_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    DB_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DB_NAME: str = os.getenv("POSTGRES_DB", "fablab_db")

    @property
    def local_database_url(self) -> str:
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # ── Cloud PostgreSQL (Supabase / Neon / Railway) ───────────────────────────
    # Set CLOUD_DATABASE_URL in .env to enable Power BI integration.
    CLOUD_DATABASE_URL: Optional[str] = os.getenv("CLOUD_DATABASE_URL")

    # ── Google Sheets (live mode) ──────────────────────────────────────────────
    # Place your service-account JSON at config/credentials.json and set the
    # sheet ID below to enable live extraction from Google Forms responses.
    GOOGLE_SHEETS_CREDENTIALS_PATH: str = os.getenv(
        "GOOGLE_SHEETS_CREDENTIALS_PATH",
        str(_ROOT / "config" / "credentials.json"),
    )
    GOOGLE_SHEET_ID: str = os.getenv("GOOGLE_SHEET_ID", "")

    # ── Data directories ───────────────────────────────────────────────────────
    RAW_DATA_DIR: Path = _ROOT / "data" / "raw"

    def get_database_url(self, cloud: bool = False) -> str:
        """Return the appropriate database URL based on the target environment."""
        if cloud:
            if not self.CLOUD_DATABASE_URL:
                raise ValueError(
                    "CLOUD_DATABASE_URL is not set in .env. "
                    "Add your Supabase / Neon / Railway connection string."
                )
            return self.CLOUD_DATABASE_URL
        return self.local_database_url


settings = Settings()
