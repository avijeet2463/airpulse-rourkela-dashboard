"""
export_for_powerbi.py
=====================
Runs key SQL queries against the SQLite database and exports the results
as clean CSVs that can be directly imported into Power BI.

Reads:  data/airpulse_rourkela.db
Writes: data/csv/monthly_summary.csv
        data/csv/seasonal_summary.csv
        data/csv/aqi_breakdown.csv
        data/csv/worst_days.csv
        data/csv/daily_dashboard.csv

Usage:
    python scripts/export_for_powerbi.py
"""

import sqlite3
import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "data" / "airpulse_rourkela.db"
CSV_DIR = PROJECT_ROOT / "data" / "csv"

# ---------------------------------------------------------------------------
# SQL Queries for Power BI exports
# ---------------------------------------------------------------------------
EXPORTS = {
    "monthly_summary.csv": """
        SELECT
            strftime('%Y-%m', date) AS month,
            ROUND(AVG(pm25), 1) AS avg_pm25,
            ROUND(AVG(pm10), 1) AS avg_pm10,
            ROUND(AVG(no2), 1) AS avg_no2,
            ROUND(AVG(so2), 1) AS avg_so2,
            ROUND(AVG(o3), 1) AS avg_o3,
            ROUND(AVG(co), 2) AS avg_co,
            ROUND(AVG(aqi), 0) AS avg_aqi,
            ROUND(MAX(pm25), 1) AS max_pm25,
            ROUND(MIN(pm25), 1) AS min_pm25,
            COUNT(*) AS days_count
        FROM air_quality
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month
    """,

    "seasonal_summary.csv": """
        SELECT
            CASE
                WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (3,4,5) THEN 'Summer'
                WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (6,7,8,9) THEN 'Monsoon'
                WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (10,11) THEN 'Post-Monsoon'
                ELSE 'Winter'
            END AS season,
            ROUND(AVG(a.pm25), 1) AS avg_pm25,
            ROUND(AVG(a.pm10), 1) AS avg_pm10,
            ROUND(AVG(a.no2), 1) AS avg_no2,
            ROUND(AVG(a.so2), 1) AS avg_so2,
            ROUND(AVG(a.o3), 1) AS avg_o3,
            ROUND(AVG(a.co), 2) AS avg_co,
            ROUND(AVG(a.aqi), 0) AS avg_aqi,
            ROUND(AVG(w.temp_mean), 1) AS avg_temp,
            ROUND(AVG(w.humidity), 1) AS avg_humidity,
            ROUND(AVG(w.wind_speed), 1) AS avg_wind,
            ROUND(SUM(w.precipitation), 1) AS total_rainfall,
            COUNT(*) AS days_count
        FROM air_quality a
        JOIN weather w ON a.date = w.date
        GROUP BY season
        ORDER BY
            CASE season
                WHEN 'Winter' THEN 1
                WHEN 'Summer' THEN 2
                WHEN 'Monsoon' THEN 3
                WHEN 'Post-Monsoon' THEN 4
            END
    """,

    "aqi_breakdown.csv": """
        SELECT
            aqi_category,
            COUNT(*) AS days_count,
            ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM air_quality), 1) AS percentage,
            ROUND(AVG(pm25), 1) AS avg_pm25,
            ROUND(AVG(aqi), 0) AS avg_aqi
        FROM air_quality
        GROUP BY aqi_category
        ORDER BY avg_aqi
    """,

    "worst_days.csv": """
        SELECT
            a.date,
            a.pm25,
            a.pm10,
            a.aqi,
            a.aqi_category,
            w.temp_mean,
            w.humidity,
            w.wind_speed,
            w.precipitation,
            w.visibility
        FROM air_quality a
        JOIN weather w ON a.date = w.date
        ORDER BY a.pm25 DESC
        LIMIT 20
    """,

    "daily_dashboard.csv": """
        SELECT
            a.date,
            a.pm25, a.pm10, a.so2, a.no2, a.o3, a.co,
            a.aqi, a.aqi_category,
            w.temp_mean, w.temp_max, w.temp_min,
            w.humidity, w.wind_speed, w.precipitation, w.visibility,
            t.search_interest,
            CASE
                WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (3,4,5) THEN 'Summer'
                WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (6,7,8,9) THEN 'Monsoon'
                WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (10,11) THEN 'Post-Monsoon'
                ELSE 'Winter'
            END AS season,
            strftime('%Y-%m', a.date) AS month,
            CASE CAST(strftime('%w', a.date) AS INTEGER)
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END AS day_of_week
        FROM air_quality a
        JOIN weather w ON a.date = w.date
        JOIN google_trends t ON a.date = t.date
        ORDER BY a.date
    """
}


def main():
    print("=" * 60)
    print("AirPulse Rourkela -- Export for Power BI")
    print("=" * 60)

    if not DB_PATH.exists():
        print(f"[!] Database not found: {DB_PATH}")
        print("    Run load_to_sqlite.py first.")
        return

    conn = sqlite3.connect(str(DB_PATH))

    CSV_DIR.mkdir(parents=True, exist_ok=True)

    for filename, query in EXPORTS.items():
        print(f"\nExporting {filename}...")
        try:
            df = pd.read_sql_query(query, conn)
            df.to_csv(CSV_DIR / filename, index=False)
            print(f"  [OK] {len(df)} rows -> {CSV_DIR / filename}")
        except Exception as e:
            print(f"  [!] Error: {e}")

    conn.close()

    print("\n" + "=" * 60)
    print("All exports complete!")
    print(f"CSVs saved in: {CSV_DIR}")
    print("\nImport these into Power BI:")
    print("  - daily_dashboard.csv   (main data source)")
    print("  - monthly_summary.csv   (aggregated view)")
    print("  - seasonal_summary.csv  (season comparison)")
    print("  - aqi_breakdown.csv     (AQI category stats)")
    print("  - worst_days.csv        (top polluted days)")
    print("=" * 60)


if __name__ == "__main__":
    main()
