-- ============================================================================
-- 04_correlation_analysis.sql
-- AirPulse Rourkela - Weather-Pollution Correlation
-- ============================================================================

-- Note: SQLite doesn't have a built-in CORR() function, so we compute
-- Pearson correlation manually using the formula:
-- r = [n*SUM(xy) - SUM(x)*SUM(y)] / SQRT([n*SUM(x2)-SUM(x)^2]*[n*SUM(y2)-SUM(y)^2])

-- 1. Temperature vs PM2.5 correlation
SELECT
    'temp_mean vs pm25' AS pair,
    COUNT(*) AS n,
    ROUND(
        (COUNT(*) * SUM(w.temp_mean * a.pm25) - SUM(w.temp_mean) * SUM(a.pm25)) /
        SQRT(
            (COUNT(*) * SUM(w.temp_mean * w.temp_mean) - SUM(w.temp_mean) * SUM(w.temp_mean)) *
            (COUNT(*) * SUM(a.pm25 * a.pm25) - SUM(a.pm25) * SUM(a.pm25))
        ), 4
    ) AS pearson_r
FROM air_quality a
JOIN weather w ON a.date = w.date;


-- 2. Humidity vs PM2.5 correlation
SELECT
    'humidity vs pm25' AS pair,
    COUNT(*) AS n,
    ROUND(
        (COUNT(*) * SUM(w.humidity * a.pm25) - SUM(w.humidity) * SUM(a.pm25)) /
        SQRT(
            (COUNT(*) * SUM(w.humidity * w.humidity) - SUM(w.humidity) * SUM(w.humidity)) *
            (COUNT(*) * SUM(a.pm25 * a.pm25) - SUM(a.pm25) * SUM(a.pm25))
        ), 4
    ) AS pearson_r
FROM air_quality a
JOIN weather w ON a.date = w.date;


-- 3. Wind Speed vs PM2.5 correlation
SELECT
    'wind_speed vs pm25' AS pair,
    COUNT(*) AS n,
    ROUND(
        (COUNT(*) * SUM(w.wind_speed * a.pm25) - SUM(w.wind_speed) * SUM(a.pm25)) /
        SQRT(
            (COUNT(*) * SUM(w.wind_speed * w.wind_speed) - SUM(w.wind_speed) * SUM(w.wind_speed)) *
            (COUNT(*) * SUM(a.pm25 * a.pm25) - SUM(a.pm25) * SUM(a.pm25))
        ), 4
    ) AS pearson_r
FROM air_quality a
JOIN weather w ON a.date = w.date;


-- 4. Precipitation vs PM2.5 correlation
SELECT
    'precipitation vs pm25' AS pair,
    COUNT(*) AS n,
    ROUND(
        (COUNT(*) * SUM(w.precipitation * a.pm25) - SUM(w.precipitation) * SUM(a.pm25)) /
        SQRT(
            (COUNT(*) * SUM(w.precipitation * w.precipitation) - SUM(w.precipitation) * SUM(w.precipitation)) *
            (COUNT(*) * SUM(a.pm25 * a.pm25) - SUM(a.pm25) * SUM(a.pm25))
        ), 4
    ) AS pearson_r
FROM air_quality a
JOIN weather w ON a.date = w.date;


-- 5. Google Trends interest vs PM2.5 correlation
SELECT
    'search_interest vs pm25' AS pair,
    COUNT(*) AS n,
    ROUND(
        (COUNT(*) * SUM(t.search_interest * a.pm25) - SUM(t.search_interest) * SUM(a.pm25)) /
        SQRT(
            (COUNT(*) * SUM(t.search_interest * t.search_interest) - SUM(t.search_interest) * SUM(t.search_interest)) *
            (COUNT(*) * SUM(a.pm25 * a.pm25) - SUM(a.pm25) * SUM(a.pm25))
        ), 4
    ) AS pearson_r
FROM air_quality a
JOIN google_trends t ON a.date = t.date;


-- 6. Monthly correlation: Does temperature-PM2.5 relationship vary by month?
SELECT
    strftime('%m', a.date) AS month,
    COUNT(*) AS n,
    ROUND(AVG(a.pm25), 1) AS avg_pm25,
    ROUND(AVG(w.temp_mean), 1) AS avg_temp,
    ROUND(
        (COUNT(*) * SUM(w.temp_mean * a.pm25) - SUM(w.temp_mean) * SUM(a.pm25)) /
        NULLIF(SQRT(
            (COUNT(*) * SUM(w.temp_mean * w.temp_mean) - SUM(w.temp_mean) * SUM(w.temp_mean)) *
            (COUNT(*) * SUM(a.pm25 * a.pm25) - SUM(a.pm25) * SUM(a.pm25))
        ), 0), 4
    ) AS temp_pm25_corr
FROM air_quality a
JOIN weather w ON a.date = w.date
GROUP BY strftime('%m', a.date)
ORDER BY month;
