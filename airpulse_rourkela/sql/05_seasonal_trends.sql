-- ============================================================================
-- 05_seasonal_trends.sql
-- AirPulse Rourkela - Seasonal & Monthly Trends
-- ============================================================================

-- Rourkela Seasons:
--   Winter:       Dec, Jan, Feb  (cold, high pollution, temperature inversion)
--   Summer:       Mar, Apr, May  (hot, moderate pollution)
--   Monsoon:      Jun, Jul, Aug, Sep (rainy, low pollution)
--   Post-Monsoon: Oct, Nov      (transition, rising pollution)

-- 1. Seasonal pollution averages
SELECT
    CASE
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (3,4,5) THEN 'Summer'
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (6,7,8,9) THEN 'Monsoon'
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (10,11) THEN 'Post-Monsoon'
        ELSE 'Winter'
    END AS season,
    COUNT(*) AS days,
    ROUND(AVG(a.pm25), 1) AS avg_pm25,
    ROUND(AVG(a.pm10), 1) AS avg_pm10,
    ROUND(AVG(a.no2), 1) AS avg_no2,
    ROUND(AVG(a.so2), 1) AS avg_so2,
    ROUND(AVG(a.o3), 1) AS avg_o3,
    ROUND(AVG(a.aqi), 0) AS avg_aqi,
    ROUND(AVG(w.temp_mean), 1) AS avg_temp,
    ROUND(AVG(w.humidity), 1) AS avg_humidity,
    ROUND(SUM(w.precipitation), 1) AS total_rainfall
FROM air_quality a
JOIN weather w ON a.date = w.date
GROUP BY season
ORDER BY
    CASE season
        WHEN 'Winter' THEN 1
        WHEN 'Summer' THEN 2
        WHEN 'Monsoon' THEN 3
        WHEN 'Post-Monsoon' THEN 4
    END;


-- 2. Month-over-month PM2.5 change
SELECT
    strftime('%Y-%m', date) AS month,
    ROUND(AVG(pm25), 1) AS avg_pm25,
    ROUND(AVG(pm25) - LAG(AVG(pm25)) OVER (ORDER BY strftime('%Y-%m', date)), 1) AS mom_change
FROM air_quality
GROUP BY strftime('%Y-%m', date)
ORDER BY month;


-- 3. Which season has the most "Very Poor" or "Severe" days?
SELECT
    CASE
        WHEN CAST(strftime('%m', date) AS INTEGER) IN (3,4,5) THEN 'Summer'
        WHEN CAST(strftime('%m', date) AS INTEGER) IN (6,7,8,9) THEN 'Monsoon'
        WHEN CAST(strftime('%m', date) AS INTEGER) IN (10,11) THEN 'Post-Monsoon'
        ELSE 'Winter'
    END AS season,
    SUM(CASE WHEN aqi_category IN ('Very Poor', 'Severe') THEN 1 ELSE 0 END) AS danger_days,
    COUNT(*) AS total_days,
    ROUND(100.0 * SUM(CASE WHEN aqi_category IN ('Very Poor', 'Severe') THEN 1 ELSE 0 END) / COUNT(*), 1) AS danger_pct
FROM air_quality
GROUP BY season
ORDER BY danger_days DESC;


-- 4. Rainfall impact: Average PM2.5 on rainy vs dry days
SELECT
    CASE WHEN w.precipitation > 0 THEN 'Rainy Day' ELSE 'Dry Day' END AS day_type,
    COUNT(*) AS days,
    ROUND(AVG(a.pm25), 1) AS avg_pm25,
    ROUND(AVG(a.pm10), 1) AS avg_pm10,
    ROUND(AVG(w.precipitation), 1) AS avg_rainfall
FROM air_quality a
JOIN weather w ON a.date = w.date
GROUP BY day_type;


-- 5. Temperature bins and pollution
SELECT
    CASE
        WHEN w.temp_mean < 20 THEN '< 20C (Cold)'
        WHEN w.temp_mean < 25 THEN '20-25C (Cool)'
        WHEN w.temp_mean < 30 THEN '25-30C (Warm)'
        WHEN w.temp_mean < 35 THEN '30-35C (Hot)'
        ELSE '> 35C (Very Hot)'
    END AS temp_bin,
    COUNT(*) AS days,
    ROUND(AVG(a.pm25), 1) AS avg_pm25,
    ROUND(AVG(a.aqi), 0) AS avg_aqi
FROM air_quality a
JOIN weather w ON a.date = w.date
GROUP BY temp_bin
ORDER BY MIN(w.temp_mean);
