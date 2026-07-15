-- ============================================================================
-- 01_create_tables.sql
-- AirPulse Rourkela - Database Schema
-- ============================================================================

-- Air Quality table
CREATE TABLE IF NOT EXISTS air_quality (
    date        TEXT PRIMARY KEY,
    pm25        REAL NOT NULL,
    pm10        REAL NOT NULL,
    so2         REAL,
    no2         REAL,
    o3          REAL,
    co          REAL,
    aqi         INTEGER,
    aqi_category TEXT
);

-- Weather table
CREATE TABLE IF NOT EXISTS weather (
    date            TEXT PRIMARY KEY,
    temp_mean       REAL NOT NULL,
    temp_max        REAL,
    temp_min        REAL,
    humidity        REAL,
    wind_speed      REAL,
    precipitation   REAL,
    visibility      REAL
);

-- Google Trends table
CREATE TABLE IF NOT EXISTS google_trends (
    date            TEXT PRIMARY KEY,
    search_interest INTEGER
);

-- Merged view joining all three tables
CREATE VIEW IF NOT EXISTS v_merged_data AS
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
    strftime('%Y-%m', a.date) AS month_year,
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
LEFT JOIN weather w ON a.date = w.date
LEFT JOIN google_trends t ON a.date = t.date;
