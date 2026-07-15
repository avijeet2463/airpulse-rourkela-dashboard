-- ============================================================================
-- 02_data_quality_checks.sql
-- AirPulse Rourkela - Data Quality & Validation
-- ============================================================================

-- 1. Total row counts per table
SELECT 'air_quality' AS table_name, COUNT(*) AS row_count FROM air_quality
UNION ALL
SELECT 'weather', COUNT(*) FROM weather
UNION ALL
SELECT 'google_trends', COUNT(*) FROM google_trends;


-- 2. Date range per table
SELECT 'air_quality' AS table_name, MIN(date) AS first_date, MAX(date) AS last_date FROM air_quality
UNION ALL
SELECT 'weather', MIN(date), MAX(date) FROM weather
UNION ALL
SELECT 'google_trends', MIN(date), MAX(date) FROM google_trends;


-- 3. Null counts in air_quality
SELECT
    SUM(CASE WHEN pm25 IS NULL THEN 1 ELSE 0 END) AS null_pm25,
    SUM(CASE WHEN pm10 IS NULL THEN 1 ELSE 0 END) AS null_pm10,
    SUM(CASE WHEN so2 IS NULL THEN 1 ELSE 0 END) AS null_so2,
    SUM(CASE WHEN no2 IS NULL THEN 1 ELSE 0 END) AS null_no2,
    SUM(CASE WHEN o3 IS NULL THEN 1 ELSE 0 END) AS null_o3,
    SUM(CASE WHEN co IS NULL THEN 1 ELSE 0 END) AS null_co,
    SUM(CASE WHEN aqi IS NULL THEN 1 ELSE 0 END) AS null_aqi
FROM air_quality;


-- 4. Null counts in weather
SELECT
    SUM(CASE WHEN temp_mean IS NULL THEN 1 ELSE 0 END) AS null_temp_mean,
    SUM(CASE WHEN humidity IS NULL THEN 1 ELSE 0 END) AS null_humidity,
    SUM(CASE WHEN wind_speed IS NULL THEN 1 ELSE 0 END) AS null_wind_speed,
    SUM(CASE WHEN precipitation IS NULL THEN 1 ELSE 0 END) AS null_precipitation
FROM weather;


-- 5. Check for duplicate dates
SELECT date, COUNT(*) AS occurrences
FROM air_quality
GROUP BY date
HAVING COUNT(*) > 1;


-- 6. Value range validation (air quality)
SELECT
    'pm25' AS metric,
    ROUND(MIN(pm25), 1) AS min_val,
    ROUND(MAX(pm25), 1) AS max_val,
    CASE WHEN MIN(pm25) >= 0 AND MAX(pm25) <= 999 THEN 'PASS' ELSE 'FAIL' END AS range_check
FROM air_quality
UNION ALL
SELECT 'pm10', ROUND(MIN(pm10),1), ROUND(MAX(pm10),1),
    CASE WHEN MIN(pm10) >= 0 AND MAX(pm10) <= 999 THEN 'PASS' ELSE 'FAIL' END
FROM air_quality
UNION ALL
SELECT 'temp_mean', ROUND(MIN(temp_mean),1), ROUND(MAX(temp_mean),1),
    CASE WHEN MIN(temp_mean) >= -10 AND MAX(temp_mean) <= 55 THEN 'PASS' ELSE 'FAIL' END
FROM weather;


-- 7. Missing date gaps (should be 0 for continuous data)
SELECT COUNT(*) AS total_days,
       JULIANDAY(MAX(date)) - JULIANDAY(MIN(date)) + 1 AS expected_days,
       CAST(JULIANDAY(MAX(date)) - JULIANDAY(MIN(date)) + 1 AS INTEGER) - COUNT(*) AS missing_days
FROM air_quality;
