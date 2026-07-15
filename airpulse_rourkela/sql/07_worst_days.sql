-- ============================================================================
-- 07_worst_days.sql
-- AirPulse Rourkela - Worst Pollution Days Analysis
-- ============================================================================

-- 1. Top 20 most polluted days (by PM2.5)
SELECT
    a.date,
    a.pm25,
    a.pm10,
    a.aqi,
    a.aqi_category,
    a.no2,
    a.so2,
    w.temp_mean,
    w.humidity,
    w.wind_speed,
    w.precipitation,
    w.visibility,
    CASE
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (3,4,5) THEN 'Summer'
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (6,7,8,9) THEN 'Monsoon'
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (10,11) THEN 'Post-Monsoon'
        ELSE 'Winter'
    END AS season
FROM air_quality a
JOIN weather w ON a.date = w.date
ORDER BY a.pm25 DESC
LIMIT 20;


-- 2. Worst day per month
SELECT
    strftime('%Y-%m', a.date) AS month,
    a.date AS worst_day,
    a.pm25 AS max_pm25,
    a.aqi AS max_aqi,
    a.aqi_category,
    w.temp_mean,
    w.wind_speed,
    w.precipitation
FROM air_quality a
JOIN weather w ON a.date = w.date
WHERE a.pm25 = (
    SELECT MAX(a2.pm25)
    FROM air_quality a2
    WHERE strftime('%Y-%m', a2.date) = strftime('%Y-%m', a.date)
)
ORDER BY a.date;


-- 3. Weather conditions during worst pollution days vs best days
SELECT 'Worst 10% Days' AS category,
    ROUND(AVG(w.temp_mean), 1) AS avg_temp,
    ROUND(AVG(w.humidity), 1) AS avg_humidity,
    ROUND(AVG(w.wind_speed), 1) AS avg_wind,
    ROUND(AVG(w.precipitation), 1) AS avg_rain,
    ROUND(AVG(w.visibility), 1) AS avg_visibility
FROM air_quality a
JOIN weather w ON a.date = w.date
WHERE a.pm25 >= (SELECT pm25 FROM air_quality ORDER BY pm25 DESC LIMIT 1 OFFSET (SELECT COUNT(*)/10 FROM air_quality))

UNION ALL

SELECT 'Best 10% Days',
    ROUND(AVG(w.temp_mean), 1),
    ROUND(AVG(w.humidity), 1),
    ROUND(AVG(w.wind_speed), 1),
    ROUND(AVG(w.precipitation), 1),
    ROUND(AVG(w.visibility), 1)
FROM air_quality a
JOIN weather w ON a.date = w.date
WHERE a.pm25 <= (SELECT pm25 FROM air_quality ORDER BY pm25 ASC LIMIT 1 OFFSET (SELECT COUNT(*)/10 FROM air_quality));


-- 4. Days where ALL pollutants exceeded safe levels simultaneously
SELECT
    a.date,
    a.pm25, a.pm10, a.no2, a.so2, a.o3,
    a.aqi, a.aqi_category
FROM air_quality a
WHERE a.pm25 > 60
  AND a.pm10 > 100
  AND a.no2 > 40
ORDER BY a.pm25 DESC;
