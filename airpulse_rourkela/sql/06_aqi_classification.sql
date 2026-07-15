-- ============================================================================
-- 06_aqi_classification.sql
-- AirPulse Rourkela - AQI Category Analysis
-- ============================================================================

-- India National Air Quality Index (NAQI) categories:
--   Good:         AQI 0-50      (PM2.5: 0-30)
--   Satisfactory: AQI 51-100    (PM2.5: 31-60)
--   Moderate:     AQI 101-200   (PM2.5: 61-90)
--   Poor:         AQI 201-300   (PM2.5: 91-120)
--   Very Poor:    AQI 301-400   (PM2.5: 121-250)
--   Severe:       AQI 401-500   (PM2.5: 251+)

-- 1. Overall AQI category breakdown
SELECT
    aqi_category,
    COUNT(*) AS days_count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM air_quality), 1) AS percentage,
    ROUND(AVG(pm25), 1) AS avg_pm25,
    ROUND(AVG(aqi), 0) AS avg_aqi,
    MIN(date) AS first_occurrence,
    MAX(date) AS last_occurrence
FROM air_quality
GROUP BY aqi_category
ORDER BY AVG(aqi);


-- 2. AQI category by month
SELECT
    strftime('%Y-%m', date) AS month,
    SUM(CASE WHEN aqi_category = 'Good' THEN 1 ELSE 0 END) AS good,
    SUM(CASE WHEN aqi_category = 'Satisfactory' THEN 1 ELSE 0 END) AS satisfactory,
    SUM(CASE WHEN aqi_category = 'Moderate' THEN 1 ELSE 0 END) AS moderate,
    SUM(CASE WHEN aqi_category = 'Poor' THEN 1 ELSE 0 END) AS poor,
    SUM(CASE WHEN aqi_category = 'Very Poor' THEN 1 ELSE 0 END) AS very_poor,
    SUM(CASE WHEN aqi_category = 'Severe' THEN 1 ELSE 0 END) AS severe
FROM air_quality
GROUP BY strftime('%Y-%m', date)
ORDER BY month;


-- 3. Consecutive bad air quality days (streaks of Poor+)
WITH bad_days AS (
    SELECT
        date,
        aqi_category,
        ROW_NUMBER() OVER (ORDER BY date) -
        ROW_NUMBER() OVER (
            PARTITION BY CASE WHEN aqi_category IN ('Poor','Very Poor','Severe') THEN 1 ELSE 0 END
            ORDER BY date
        ) AS grp
    FROM air_quality
    WHERE aqi_category IN ('Poor', 'Very Poor', 'Severe')
)
SELECT
    MIN(date) AS streak_start,
    MAX(date) AS streak_end,
    COUNT(*) AS streak_length
FROM bad_days
GROUP BY grp
HAVING COUNT(*) >= 3
ORDER BY streak_length DESC;


-- 4. Days exceeding WHO guidelines (PM2.5 daily > 15 ug/m3)
SELECT
    COUNT(*) AS days_exceeding_who,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM air_quality), 1) AS pct_exceeding,
    ROUND(AVG(pm25), 1) AS avg_pm25_on_bad_days
FROM air_quality
WHERE pm25 > 15;


-- 5. AQI category transition matrix (what category follows what?)
SELECT
    prev.aqi_category AS from_category,
    curr.aqi_category AS to_category,
    COUNT(*) AS transitions
FROM air_quality curr
JOIN air_quality prev ON DATE(curr.date) = DATE(prev.date, '+1 day')
GROUP BY prev.aqi_category, curr.aqi_category
ORDER BY prev.aqi_category, curr.aqi_category;
