-- ============================================================================
-- 03_descriptive_stats.sql
-- AirPulse Rourkela - Descriptive Statistics
-- ============================================================================

-- 1. Overall summary statistics for pollutants
SELECT
    COUNT(*) AS total_days,
    ROUND(AVG(pm25), 1) AS avg_pm25,
    ROUND(MIN(pm25), 1) AS min_pm25,
    ROUND(MAX(pm25), 1) AS max_pm25,
    ROUND(AVG(pm10), 1) AS avg_pm10,
    ROUND(AVG(no2), 1) AS avg_no2,
    ROUND(AVG(so2), 1) AS avg_so2,
    ROUND(AVG(o3), 1) AS avg_o3,
    ROUND(AVG(co), 2) AS avg_co,
    ROUND(AVG(aqi), 0) AS avg_aqi
FROM air_quality;


-- 2. Monthly averages for PM2.5 and PM10
SELECT
    strftime('%Y-%m', date) AS month,
    COUNT(*) AS days,
    ROUND(AVG(pm25), 1) AS avg_pm25,
    ROUND(AVG(pm10), 1) AS avg_pm10,
    ROUND(MIN(pm25), 1) AS min_pm25,
    ROUND(MAX(pm25), 1) AS max_pm25,
    ROUND(AVG(aqi), 0) AS avg_aqi
FROM air_quality
GROUP BY strftime('%Y-%m', date)
ORDER BY month;


-- 3. Monthly weather averages
SELECT
    strftime('%Y-%m', date) AS month,
    ROUND(AVG(temp_mean), 1) AS avg_temp,
    ROUND(AVG(humidity), 1) AS avg_humidity,
    ROUND(AVG(wind_speed), 1) AS avg_wind,
    ROUND(SUM(precipitation), 1) AS total_rainfall_mm
FROM weather
GROUP BY strftime('%Y-%m', date)
ORDER BY month;


-- 4. Day-of-week analysis (is pollution different on weekends?)
SELECT
    CASE CAST(strftime('%w', date) AS INTEGER)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END AS day_name,
    CAST(strftime('%w', date) AS INTEGER) AS day_num,
    ROUND(AVG(pm25), 1) AS avg_pm25,
    ROUND(AVG(pm10), 1) AS avg_pm10,
    COUNT(*) AS sample_size
FROM air_quality
GROUP BY CAST(strftime('%w', date) AS INTEGER)
ORDER BY day_num;


-- 5. Percentile analysis (approximate using ORDER BY + LIMIT)
-- Top 10% worst PM2.5 days
SELECT
    date, pm25, aqi, aqi_category
FROM air_quality
ORDER BY pm25 DESC
LIMIT (SELECT COUNT(*) / 10 FROM air_quality);
