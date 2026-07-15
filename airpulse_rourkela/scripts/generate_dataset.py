"""
generate_dataset.py
====================
Generates 365 days of realistic air quality, weather, and Google Trends
data for Rourkela, Odisha, India. No API keys needed.

The data mimics real-world patterns:
  - Winter (Nov-Feb): High pollution due to temperature inversion + crop burning
  - Monsoon (Jun-Sep): Low pollution due to rain washout
  - Summer (Mar-May): Moderate pollution, high temperatures
  - Post-Monsoon (Oct): Transition period

Writes:
    data/csv/air_quality.csv
    data/csv/weather.csv
    data/csv/google_trends.csv
    data/csv/merged_dataset.csv

Usage:
    python scripts/generate_dataset.py
"""

import numpy as np
import pandas as pd
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DAYS = 365
SEED = 42
START_DATE = "2024-01-01"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_DIR = PROJECT_ROOT / "data" / "csv"

# AQI breakpoints for PM2.5 (India NAQI standard)
AQI_BREAKPOINTS = [
    (0, 30, "Good"),
    (31, 60, "Satisfactory"),
    (61, 90, "Moderate"),
    (91, 120, "Poor"),
    (121, 250, "Very Poor"),
    (251, 500, "Severe"),
]


def classify_aqi(pm25):
    """Classify PM2.5 value into AQI category (India NAQI)."""
    for low, high, category in AQI_BREAKPOINTS:
        if low <= pm25 <= high:
            return category
    if pm25 > 500:
        return "Severe"
    return "Good"


def compute_aqi(pm25):
    """Compute approximate AQI value from PM2.5."""
    # Simplified Indian AQI sub-index for PM2.5
    breakpoints = [
        (0, 30, 0, 50),
        (31, 60, 51, 100),
        (61, 90, 101, 200),
        (91, 120, 201, 300),
        (121, 250, 301, 400),
        (251, 500, 401, 500),
    ]
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= pm25 <= c_high:
            aqi = ((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low
            return round(aqi)
    if pm25 > 500:
        return 500
    return 0


def generate_weather(dates):
    """Generate realistic Rourkela weather data."""
    n = len(dates)
    day_of_year = dates.dayofyear

    # Rourkela temperature pattern:
    # Summer (Mar-May): 35-45C, Monsoon (Jun-Sep): 25-35C
    # Winter (Nov-Feb): 10-25C, Post-Monsoon (Oct): 25-30C
    temp_mean = 27 + 8 * np.sin(2 * np.pi * (day_of_year - 135) / 365)
    temp_mean += np.random.normal(0, 2, n)
    temp_max = temp_mean + 5 + np.random.normal(0, 1.5, n)
    temp_min = temp_mean - 5 + np.random.normal(0, 1.5, n)

    # Humidity: high in monsoon (Jun-Sep), low in winter
    humidity = 55 + 25 * np.sin(2 * np.pi * (day_of_year - 200) / 365)
    humidity += np.random.normal(0, 8, n)
    humidity = np.clip(humidity, 15, 100)

    # Wind speed: higher in summer, lower in winter
    wind_speed = 6 + 3 * np.sin(2 * np.pi * (day_of_year - 120) / 365)
    wind_speed += np.random.exponential(1.5, n)
    wind_speed = np.clip(wind_speed, 0.5, 25)

    # Precipitation: heavy in monsoon (Jun-Sep)
    monsoon_factor = np.exp(-((day_of_year - 210) ** 2) / (2 * 40 ** 2))
    precip_prob = 0.05 + 0.65 * monsoon_factor
    has_rain = np.random.random(n) < precip_prob
    precip = np.where(has_rain, np.random.exponential(8, n) * (1 + 3 * monsoon_factor), 0)
    precip = np.round(precip, 1)

    # Visibility: low in winter (fog), low in heavy pollution days
    visibility = 8 + 4 * np.sin(2 * np.pi * (day_of_year - 180) / 365)
    visibility += np.random.normal(0, 1.5, n)
    visibility = np.clip(visibility, 0.5, 15)

    return pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "temp_mean": np.round(temp_mean, 1),
        "temp_max": np.round(temp_max, 1),
        "temp_min": np.round(temp_min, 1),
        "humidity": np.round(humidity, 1),
        "wind_speed": np.round(wind_speed, 1),
        "precipitation": precip,
        "visibility": np.round(visibility, 1),
    })


def generate_air_quality(dates, weather_df):
    """Generate realistic Rourkela air quality data influenced by weather."""
    n = len(dates)
    day_of_year = dates.dayofyear

    temp = weather_df["temp_mean"].values
    humidity = weather_df["humidity"].values
    wind = weather_df["wind_speed"].values
    rain = weather_df["precipitation"].values

    # PM2.5 base: high in winter, low in monsoon
    # Winter inversion + crop burning = very high
    winter_factor = np.exp(-((day_of_year - 15) ** 2) / (2 * 50 ** 2)) + \
                    np.exp(-((day_of_year - 350) ** 2) / (2 * 50 ** 2))
    monsoon_wash = np.exp(-((day_of_year - 210) ** 2) / (2 * 40 ** 2))

    pm25_base = 45 + 80 * winter_factor - 30 * monsoon_wash
    # Weather influence
    pm25_base -= 0.8 * (temp - 25)          # higher temp = more dispersion
    pm25_base -= 1.5 * (wind - 5)           # higher wind = more dispersion
    pm25_base += 0.2 * (humidity - 50)      # humidity can trap particles
    pm25_base -= 2.0 * np.minimum(rain, 10) # rain washes out pollution
    pm25 = pm25_base + np.random.normal(0, 12, n)
    pm25 = np.clip(pm25, 8, 400)

    # PM10 ~ 1.5-2x PM2.5 (coarser particles from dust, construction)
    pm10 = pm25 * (1.7 + np.random.normal(0, 0.2, n))
    pm10 = np.clip(pm10, 12, 600)

    # SO2: industrial city, moderate levels
    so2 = 15 + 10 * winter_factor + np.random.normal(0, 5, n)
    so2 = np.clip(so2, 2, 80)

    # NO2: vehicular + industrial
    no2 = 25 + 15 * winter_factor - 8 * monsoon_wash + np.random.normal(0, 8, n)
    no2 = np.clip(no2, 5, 100)

    # O3: higher in summer (photochemical), lower in monsoon
    o3 = 30 + 20 * np.sin(2 * np.pi * (day_of_year - 135) / 365) + np.random.normal(0, 10, n)
    o3 = np.clip(o3, 5, 120)

    # CO: combustion-related, higher in winter
    co = 0.8 + 0.5 * winter_factor + np.random.normal(0, 0.2, n)
    co = np.clip(co, 0.1, 3.0)

    # Compute AQI
    aqi_values = [compute_aqi(v) for v in pm25]
    aqi_categories = [classify_aqi(v) for v in pm25]

    return pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "pm25": np.round(pm25, 1),
        "pm10": np.round(pm10, 1),
        "so2": np.round(so2, 1),
        "no2": np.round(no2, 1),
        "o3": np.round(o3, 1),
        "co": np.round(co, 2),
        "aqi": aqi_values,
        "aqi_category": aqi_categories,
    })


def generate_trends(dates, aq_df):
    """Generate Google Trends interest correlated with pollution spikes."""
    n = len(dates)
    pm25 = aq_df["pm25"].values

    # Base interest: loosely follows pollution with some lag
    interest_base = 20 + 0.3 * np.roll(pm25, 3)  # 3-day lag
    interest_base[:3] = 20 + 0.3 * pm25[:3]

    # Add media spikes (random days with high interest)
    spikes = np.zeros(n)
    spike_days = np.random.choice(n, size=15, replace=False)
    spikes[spike_days] = np.random.uniform(20, 50, 15)

    interest = interest_base + spikes + np.random.normal(0, 8, n)
    interest = np.clip(interest, 0, 100).astype(int)

    return pd.DataFrame({
        "date": dates.strftime("%Y-%m-%d"),
        "search_interest": interest,
    })


def generate_merged(weather_df, aq_df, trends_df):
    """Merge all three datasets by date."""
    merged = weather_df.merge(aq_df, on="date").merge(trends_df, on="date")
    return merged


def main():
    print("=" * 60)
    print("AirPulse Rourkela -- Generate Dataset (365 Days)")
    print("=" * 60)

    np.random.seed(SEED)
    dates = pd.date_range(start=START_DATE, periods=DAYS, freq="D")

    # Generate each dataset
    print("[1/5] Generating weather data...")
    weather_df = generate_weather(dates)

    print("[2/5] Generating air quality data...")
    aq_df = generate_air_quality(dates, weather_df)

    print("[3/5] Generating Google Trends data...")
    trends_df = generate_trends(dates, aq_df)

    print("[4/5] Creating merged dataset...")
    merged_df = generate_merged(weather_df, aq_df, trends_df)

    # Save all CSVs
    print("[5/5] Saving CSVs...")
    CSV_DIR.mkdir(parents=True, exist_ok=True)

    weather_df.to_csv(CSV_DIR / "weather.csv", index=False)
    aq_df.to_csv(CSV_DIR / "air_quality.csv", index=False)
    trends_df.to_csv(CSV_DIR / "google_trends.csv", index=False)
    merged_df.to_csv(CSV_DIR / "merged_dataset.csv", index=False)

    print(f"\nSaved to {CSV_DIR}/:")
    print(f"  weather.csv         ({len(weather_df)} rows, {len(weather_df.columns)} cols)")
    print(f"  air_quality.csv     ({len(aq_df)} rows, {len(aq_df.columns)} cols)")
    print(f"  google_trends.csv   ({len(trends_df)} rows, {len(trends_df.columns)} cols)")
    print(f"  merged_dataset.csv  ({len(merged_df)} rows, {len(merged_df.columns)} cols)")

    # Quick summary
    print(f"\nDate range: {dates[0].strftime('%Y-%m-%d')} to {dates[-1].strftime('%Y-%m-%d')}")
    print(f"AQI breakdown:")
    for cat, count in aq_df["aqi_category"].value_counts().items():
        print(f"  {cat}: {count} days ({100*count/len(aq_df):.1f}%)")

    print("\nDone! Next: python scripts/load_to_sqlite.py")


if __name__ == "__main__":
    main()
