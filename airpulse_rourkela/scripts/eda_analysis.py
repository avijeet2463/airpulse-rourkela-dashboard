"""
eda_analysis.py
===============
Performs Exploratory Data Analysis on the merged dataset and generates
6 publication-quality charts.

Reads:  data/airpulse_rourkela.db (or data/csv/merged_dataset.csv)
Writes: outputs/plots/*.png (6 charts)

Usage:
    python scripts/eda_analysis.py
"""

import sqlite3
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "data" / "airpulse_rourkela.db"
CSV_PATH = PROJECT_ROOT / "data" / "csv" / "merged_dataset.csv"
PLOTS_DIR = PROJECT_ROOT / "outputs" / "plots"

PLOTS_DIR.mkdir(parents=True, exist_ok=True)

# Styling
sns.set_theme(style="whitegrid", font_scale=1.1)
COLORS = {
    "Good": "#4CAF50",
    "Satisfactory": "#8BC34A",
    "Moderate": "#FFC107",
    "Poor": "#FF9800",
    "Very Poor": "#F44336",
    "Severe": "#9C27B0",
}


def load_data():
    """Load data from SQLite or fallback to CSV."""
    if DB_PATH.exists():
        conn = sqlite3.connect(str(DB_PATH))
        df = pd.read_sql_query("SELECT * FROM merged_data ORDER BY date", conn)
        conn.close()
        print(f"Loaded from SQLite: {len(df)} rows")
    elif CSV_PATH.exists():
        df = pd.read_csv(CSV_PATH)
        print(f"Loaded from CSV: {len(df)} rows")
    else:
        print("[!] No data found. Run generate_dataset.py first.")
        return None

    df["date"] = pd.to_datetime(df["date"])
    return df


# ===== Chart 1: PM2.5 Time Series with AQI Bands ============================

def plot_pm25_timeseries(df):
    """PM2.5 daily values with colored AQI background bands."""
    fig, ax = plt.subplots(figsize=(14, 5))

    # AQI bands
    bands = [
        (0, 30, "#4CAF50", "Good", 0.15),
        (30, 60, "#8BC34A", "Satisfactory", 0.15),
        (60, 90, "#FFC107", "Moderate", 0.15),
        (90, 120, "#FF9800", "Poor", 0.15),
        (120, 250, "#F44336", "Very Poor", 0.10),
    ]
    for ymin, ymax, color, label, alpha in bands:
        ax.axhspan(ymin, ymax, color=color, alpha=alpha, label=label)

    # PM2.5 line
    ax.plot(df["date"], df["pm25"], color="#1565C0", linewidth=0.8, alpha=0.9)

    # 7-day rolling average
    rolling = df["pm25"].rolling(7).mean()
    ax.plot(df["date"], rolling, color="#E91E63", linewidth=2, label="7-day avg")

    ax.set_title("Daily PM2.5 Levels in Rourkela (2024)", fontsize=14, fontweight="bold")
    ax.set_xlabel("Date")
    ax.set_ylabel("PM2.5 (ug/m3)")
    ax.set_ylim(0, df["pm25"].max() * 1.1)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b"))
    ax.xaxis.set_major_locator(mdates.MonthLocator())
    ax.legend(loc="upper right", fontsize=8, ncol=3)
    plt.tight_layout()

    path = PLOTS_DIR / "pm25_timeseries.png"
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"  [OK] {path.name}")


# ===== Chart 2: Monthly Pollution Boxplot ====================================

def plot_monthly_boxplot(df):
    """Monthly distribution of PM2.5 as boxplots."""
    fig, ax = plt.subplots(figsize=(12, 5))

    df_plot = df.copy()
    df_plot["month"] = df_plot["date"].dt.strftime("%b")
    df_plot["month_num"] = df_plot["date"].dt.month
    df_plot = df_plot.sort_values("month_num")

    month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    sns.boxplot(data=df_plot, x="month", y="pm25", hue="month", order=month_order,
                palette="RdYlGn_r", ax=ax, fliersize=3, legend=False)

    ax.axhline(60, color="orange", linestyle="--", alpha=0.7, label="WHO Guideline (60)")
    ax.set_title("Monthly PM2.5 Distribution - Rourkela (2024)", fontsize=14, fontweight="bold")
    ax.set_xlabel("Month")
    ax.set_ylabel("PM2.5 (ug/m3)")
    ax.legend()
    plt.tight_layout()

    path = PLOTS_DIR / "monthly_boxplot.png"
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"  [OK] {path.name}")


# ===== Chart 3: Correlation Heatmap ==========================================

def plot_correlation_heatmap(df):
    """Correlation matrix of all numeric variables."""
    fig, ax = plt.subplots(figsize=(12, 9))

    numeric_cols = ["pm25", "pm10", "so2", "no2", "o3", "co",
                    "temp_mean", "humidity", "wind_speed", "precipitation",
                    "visibility", "search_interest"]
    cols = [c for c in numeric_cols if c in df.columns]
    corr = df[cols].corr()

    mask = np.triu(np.ones_like(corr, dtype=bool))
    sns.heatmap(corr, mask=mask, annot=True, fmt=".2f", cmap="RdBu_r",
                center=0, linewidths=0.5, ax=ax, square=True,
                cbar_kws={"shrink": 0.8})

    ax.set_title("Correlation Matrix - Air Quality, Weather & Trends",
                 fontsize=14, fontweight="bold")
    plt.tight_layout()

    path = PLOTS_DIR / "correlation_heatmap.png"
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"  [OK] {path.name}")


# ===== Chart 4: AQI Distribution ============================================

def plot_aqi_distribution(df):
    """Donut chart showing AQI category distribution."""
    fig, ax = plt.subplots(figsize=(8, 8))

    category_order = ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]
    counts = df["aqi_category"].value_counts()

    # Reorder
    labels = [c for c in category_order if c in counts.index]
    sizes = [counts[c] for c in labels]
    colors = [COLORS.get(c, "#999") for c in labels]

    wedges, texts, autotexts = ax.pie(
        sizes, labels=labels, colors=colors, autopct="%1.1f%%",
        startangle=90, pctdistance=0.75, textprops={"fontsize": 11}
    )

    # Donut hole
    centre = plt.Circle((0, 0), 0.50, fc="white")
    ax.add_patch(centre)
    ax.text(0, 0, f"{len(df)}\ndays", ha="center", va="center",
            fontsize=16, fontweight="bold")

    ax.set_title("AQI Category Distribution - Rourkela (2024)",
                 fontsize=14, fontweight="bold", pad=20)
    plt.tight_layout()

    path = PLOTS_DIR / "aqi_distribution.png"
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"  [OK] {path.name}")


# ===== Chart 5: Weather vs Pollution Scatter =================================

def plot_weather_vs_pollution(df):
    """Scatter plots: temperature, humidity, wind vs PM2.5."""
    fig, axes = plt.subplots(1, 3, figsize=(16, 5))

    pairs = [
        ("temp_mean", "Temperature (C)", "#E91E63"),
        ("humidity", "Humidity (%)", "#2196F3"),
        ("wind_speed", "Wind Speed (km/h)", "#4CAF50"),
    ]

    for ax, (col, xlabel, color) in zip(axes, pairs):
        ax.scatter(df[col], df["pm25"], alpha=0.4, s=15, color=color)

        # Trend line
        z = np.polyfit(df[col], df["pm25"], 1)
        p = np.poly1d(z)
        x_range = np.linspace(df[col].min(), df[col].max(), 100)
        ax.plot(x_range, p(x_range), color="black", linewidth=2, linestyle="--")

        corr = df[col].corr(df["pm25"])
        ax.set_xlabel(xlabel)
        ax.set_ylabel("PM2.5 (ug/m3)")
        ax.set_title(f"r = {corr:.3f}", fontsize=12)
        ax.grid(True, alpha=0.3)

    fig.suptitle("Weather Variables vs PM2.5 - Rourkela (2024)",
                 fontsize=14, fontweight="bold", y=1.02)
    plt.tight_layout()

    path = PLOTS_DIR / "weather_vs_pollution.png"
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  [OK] {path.name}")


# ===== Chart 6: Seasonal Pattern ============================================

def plot_seasonal_pattern(df):
    """Grouped bar chart showing seasonal averages of key pollutants."""
    fig, ax = plt.subplots(figsize=(10, 6))

    df_plot = df.copy()
    month = df_plot["date"].dt.month
    conditions = [
        month.isin([3, 4, 5]),
        month.isin([6, 7, 8, 9]),
        month.isin([10, 11]),
        month.isin([12, 1, 2]),
    ]
    choices = ["Summer", "Monsoon", "Post-Monsoon", "Winter"]
    df_plot["season"] = np.select(conditions, choices, default="Other")

    season_order = ["Winter", "Summer", "Monsoon", "Post-Monsoon"]
    pollutants = ["pm25", "pm10", "no2", "so2", "o3"]

    seasonal_avg = df_plot.groupby("season")[pollutants].mean()
    seasonal_avg = seasonal_avg.reindex(season_order)

    x = np.arange(len(season_order))
    width = 0.15
    colors = ["#F44336", "#FF9800", "#2196F3", "#FFC107", "#4CAF50"]

    for i, (pol, color) in enumerate(zip(pollutants, colors)):
        ax.bar(x + i * width, seasonal_avg[pol], width, label=pol.upper(),
               color=color, alpha=0.85)

    ax.set_xlabel("Season", fontsize=12)
    ax.set_ylabel("Concentration (ug/m3)", fontsize=12)
    ax.set_title("Seasonal Pollution Pattern - Rourkela (2024)",
                 fontsize=14, fontweight="bold")
    ax.set_xticks(x + width * 2)
    ax.set_xticklabels(season_order)
    ax.legend(ncol=5, fontsize=9)
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()

    path = PLOTS_DIR / "seasonal_pattern.png"
    fig.savefig(path, dpi=150)
    plt.close(fig)
    print(f"  [OK] {path.name}")


# =============================================================================
# Main
# =============================================================================

def main():
    print("=" * 60)
    print("AirPulse Rourkela -- Exploratory Data Analysis")
    print("=" * 60)

    df = load_data()
    if df is None:
        return

    print(f"\nDataset: {len(df)} rows x {len(df.columns)} columns")
    print(f"Date range: {df['date'].min().strftime('%Y-%m-%d')} to "
          f"{df['date'].max().strftime('%Y-%m-%d')}")

    # Summary stats
    print("\n--- Key Statistics ---")
    stats_cols = ["pm25", "pm10", "temp_mean", "humidity", "wind_speed"]
    for col in stats_cols:
        if col in df.columns:
            print(f"  {col:20s}: mean={df[col].mean():.1f}, "
                  f"min={df[col].min():.1f}, max={df[col].max():.1f}")

    print(f"\n--- Generating Charts ---")

    plot_pm25_timeseries(df)
    plot_monthly_boxplot(df)
    plot_correlation_heatmap(df)
    plot_aqi_distribution(df)
    plot_weather_vs_pollution(df)
    plot_seasonal_pattern(df)

    print(f"\nAll 6 charts saved to: {PLOTS_DIR}")
    print("\nDone! Next: python scripts/export_for_powerbi.py")


if __name__ == "__main__":
    main()
