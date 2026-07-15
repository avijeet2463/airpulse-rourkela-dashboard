-- ============================================================================
-- 08_powerbi_views.sql
-- AirPulse Rourkela - Views Optimized for Power BI Import
-- ============================================================================

-- These views pre-compute common calculations so Power BI can import
-- them directly without needing complex DAX formulas.

-- 1. Daily dashboard view (primary Power BI data source)
CREATE VIEW IF NOT EXISTS v_daily_dashboard AS
SELECT
    a.date,
    a.pm25, a.pm10, a.so2, a.no2, a.o3, a.co,
    a.aqi, a.aqi_category,
    w.temp_mean, w.temp_max, w.temp_min,
    w.humidity, w.wind_speed, w.precipitation, w.visibility,
    t.search_interest,
    -- Computed columns for Power BI
    CASE
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (3,4,5) THEN 'Summer'
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (6,7,8,9) THEN 'Monsoon'
        WHEN CAST(strftime('%m', a.date) AS INTEGER) IN (10,11) THEN 'Post-Monsoon'
        ELSE 'Winter'
    END AS season,
    strftime('%Y-%m', a.date) AS month_year,
    strftime('%m', a.date) AS month_num,
    CASE CAST(strftime('%m', a.date) AS INTEGER)
        WHEN 1 THEN 'January' WHEN 2 THEN 'February' WHEN 3 THEN 'March'
        WHEN 4 THEN 'April' WHEN 5 THEN 'May' WHEN 6 THEN 'June'
        WHEN 7 THEN 'July' WHEN 8 THEN 'August' WHEN 9 THEN 'September'
        WHEN 10 THEN 'October' WHEN 11 THEN 'November' WHEN 12 THEN 'December'
    END AS month_name,
    CASE CAST(strftime('%w', a.date) AS INTEGER)
        WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday'
    END AS day_of_week,
    CASE WHEN w.precipitation > 0 THEN 'Rainy' ELSE 'Dry' END AS rain_status,
    CASE
        WHEN a.pm25 <= 30 THEN '#4CAF50'
        WHEN a.pm25 <= 60 THEN '#8BC34A'
        WHEN a.pm25 <= 90 THEN '#FFC107'
        WHEN a.pm25 <= 120 THEN '#FF9800'
        WHEN a.pm25 <= 250 THEN '#F44336'
        ELSE '#9C27B0'
    END AS aqi_color
FROM air_quality a
LEFT JOIN weather w ON a.date = w.date
LEFT JOIN google_trends t ON a.date = t.date;


-- 2. Monthly summary view
CREATE VIEW IF NOT EXISTS v_monthly_summary AS
SELECT
    strftime('%Y-%m', date) AS month,
    CASE CAST(strftime('%m', date) AS INTEGER)
        WHEN 1 THEN 'January' WHEN 2 THEN 'February' WHEN 3 THEN 'March'
        WHEN 4 THEN 'April' WHEN 5 THEN 'May' WHEN 6 THEN 'June'
        WHEN 7 THEN 'July' WHEN 8 THEN 'August' WHEN 9 THEN 'September'
        WHEN 10 THEN 'October' WHEN 11 THEN 'November' WHEN 12 THEN 'December'
    END AS month_name,
    COUNT(*) AS total_days,
    ROUND(AVG(pm25), 1) AS avg_pm25,
    ROUND(MAX(pm25), 1) AS max_pm25,
    ROUND(MIN(pm25), 1) AS min_pm25,
    ROUND(AVG(aqi), 0) AS avg_aqi,
    SUM(CASE WHEN aqi_category IN ('Good', 'Satisfactory') THEN 1 ELSE 0 END) AS good_days,
    SUM(CASE WHEN aqi_category IN ('Poor', 'Very Poor', 'Severe') THEN 1 ELSE 0 END) AS bad_days
FROM air_quality
GROUP BY strftime('%Y-%m', date);


-- 3. Seasonal comparison view
CREATE VIEW IF NOT EXISTS v_seasonal_comparison AS
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
    ROUND(AVG(a.aqi), 0) AS avg_aqi,
    ROUND(AVG(w.temp_mean), 1) AS avg_temp,
    ROUND(AVG(w.humidity), 1) AS avg_humidity,
    ROUND(SUM(w.precipitation), 1) AS total_rainfall
FROM air_quality a
JOIN weather w ON a.date = w.date
GROUP BY season;
