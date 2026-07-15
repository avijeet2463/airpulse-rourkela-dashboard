"""
load_to_sqlite.py
=================
Loads all CSVs from data/csv/ into a SQLite database, creates proper
tables with data types, and builds views for analysis.

Reads:  data/csv/*.csv
Writes: data/airpulse_rourkela.db

Usage:
    python scripts/load_to_sqlite.py
"""

import sqlite3
import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = PROJECT_ROOT / "data" / "csv"
DB_PATH = PROJECT_ROOT / "data" / "airpulse_rourkela.db"
SQL_DIR = PROJECT_ROOT / "sql"


def create_database():
    """Create SQLite database and load all CSVs."""
    print("=" * 60)
    print("AirPulse Rourkela -- Load Data to SQLite")
    print("=" * 60)

    # Remove old database if exists
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"Removed old database: {DB_PATH}")

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()

    # --- Run schema creation SQL if available ---
    schema_file = SQL_DIR / "01_create_tables.sql"
    if schema_file.exists():
        print("\n[1/4] Running schema creation SQL...")
        sql = schema_file.read_text(encoding="utf-8")
        cursor.executescript(sql)
        conn.commit()
        print("  Tables and views created from SQL schema.")
    else:
        print("\n[1/4] No schema SQL found, creating tables from CSV structure...")

    # --- Load CSVs ---
    csv_table_map = {
        "air_quality.csv": "air_quality",
        "weather.csv": "weather",
        "google_trends.csv": "google_trends",
        "merged_dataset.csv": "merged_data",
    }

    print("\n[2/4] Loading CSV data into tables...")
    for csv_name, table_name in csv_table_map.items():
        csv_path = CSV_DIR / csv_name
        if not csv_path.exists():
            print(f"  [!] Skipping {csv_name} (not found)")
            continue

        df = pd.read_csv(csv_path)

        # Use 'replace' to overwrite if table was created by schema
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        print(f"  [OK] {table_name}: {len(df)} rows loaded from {csv_name}")

    # --- Run Power BI views SQL if available ---
    views_file = SQL_DIR / "08_powerbi_views.sql"
    if views_file.exists():
        print("\n[3/4] Creating Power BI views...")
        sql = views_file.read_text(encoding="utf-8")
        try:
            cursor.executescript(sql)
            conn.commit()
            print("  Views created successfully.")
        except sqlite3.OperationalError as e:
            print(f"  [!] View creation warning: {e}")

    # --- Verify ---
    print("\n[4/4] Verification:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    for (table_name,) in tables:
        cursor.execute(f"SELECT COUNT(*) FROM [{table_name}]")
        count = cursor.fetchone()[0]
        print(f"  Table '{table_name}': {count} rows")

    cursor.execute("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name")
    views = cursor.fetchall()
    if views:
        print(f"  Views: {', '.join(v[0] for v in views)}")

    conn.close()
    print(f"\nDatabase saved: {DB_PATH}")
    print(f"Size: {DB_PATH.stat().st_size / 1024:.1f} KB")
    print("\nDone! Next: python scripts/eda_analysis.py")


if __name__ == "__main__":
    create_database()
