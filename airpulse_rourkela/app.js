/**
 * app.js — Main Application Controller
 * =====================================
 * Handles CSV data loading, top-nav page navigation, and initialization.
 */

// ---------------------------------------------------------------------------
// Global Data Store
// ---------------------------------------------------------------------------
window.airpulse = {
    daily: [], monthly: [], seasonal: [], aqi: [], worst: [],
    loaded: false,
    chartsInitialized: { overview: false, weather: false, seasonal: false, prediction: false },
};

// ---------------------------------------------------------------------------
// CSV Loading
// ---------------------------------------------------------------------------
const CSV_BASE = 'data/csv/';
const CSV_FILES = {
    daily: 'daily_dashboard.csv',
    monthly: 'monthly_summary.csv',
    seasonal: 'seasonal_summary.csv',
    aqi: 'aqi_breakdown.csv',
    worst: 'worst_days.csv',
};

function loadCSV(filename) {
    return new Promise((resolve, reject) => {
        Papa.parse(CSV_BASE + filename, {
            download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err),
        });
    });
}

async function loadAllData() {
    try {
        const [daily, monthly, seasonal, aqi, worst] = await Promise.all([
            loadCSV(CSV_FILES.daily), loadCSV(CSV_FILES.monthly),
            loadCSV(CSV_FILES.seasonal), loadCSV(CSV_FILES.aqi), loadCSV(CSV_FILES.worst),
        ]);
        window.airpulse.daily = daily;
        window.airpulse.monthly = monthly;
        window.airpulse.seasonal = seasonal;
        window.airpulse.aqi = aqi;
        window.airpulse.worst = worst;
        window.airpulse.loaded = true;
        console.log(`✅ Data loaded: ${daily.length} daily, ${monthly.length} monthly, ${seasonal.length} seasonal`);
        return true;
    } catch (err) {
        console.error('❌ Failed to load CSV data:', err);
        document.querySelector('.loading-text').textContent = 'Error loading data. Ensure you serve from the project root directory.';
        return false;
    }
}

// ---------------------------------------------------------------------------
// Page Navigation (Top Tabs)
// ---------------------------------------------------------------------------
function setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach((tab) => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(tab.dataset.page);
        });
    });
}

function switchPage(pageId) {
    document.querySelectorAll('.nav-tab').forEach((t) => t.classList.toggle('active', t.dataset.page === pageId));
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
    if (window.airpulse.loaded) initChartsForPage(pageId);
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------
function populateKPIs() {
    const data = window.airpulse.daily;
    if (!data.length) return;
    animateCounter('kpi-avg-aqi', Math.round(data.reduce((s, d) => s + (d.aqi || 0), 0) / data.length));
    animateCounter('kpi-avg-pm25', (data.reduce((s, d) => s + (d.pm25 || 0), 0) / data.length).toFixed(1));
    animateCounter('kpi-good-days', data.filter((d) => d.aqi <= 50).length);
    animateCounter('kpi-bad-days', data.filter((d) => d.aqi > 200).length);
}

function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const target = parseFloat(targetValue);
    const isDecimal = String(targetValue).includes('.');
    const duration = 1200, startTime = performance.now();
    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = isDecimal ? (target * eased).toFixed(1) : Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = targetValue;
    }
    requestAnimationFrame(update);
}

// ---------------------------------------------------------------------------
// Worst Days Table
// ---------------------------------------------------------------------------
function populateWorstDaysTable() {
    const tbody = document.querySelector('#worst-days-table tbody');
    if (!tbody) return;
    tbody.innerHTML = window.airpulse.worst.slice(0, 10).map((d) => {
        const cat = (d.aqi_category || '').toLowerCase().replace(/\s+/g, '-');
        const dateStr = d.date ? new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : d.date;
        return `<tr><td>${dateStr}</td><td>${d.pm25}</td><td><span class="aqi-badge ${cat}">${d.aqi} ${d.aqi_category}</span></td></tr>`;
    }).join('');
}

// ---------------------------------------------------------------------------
// Seasonal Summary
// ---------------------------------------------------------------------------
function populateSeasonalSummary() {
    const data = window.airpulse.seasonal;
    data.forEach((s) => {
        const season = (s.season || '').toLowerCase().replace('-', '');
        let elId;
        if (season === 'winter') elId = 'season-winter-aqi';
        else if (season === 'summer') elId = 'season-summer-aqi';
        else if (season === 'monsoon') elId = 'season-monsoon-aqi';
        else if (season.includes('post')) elId = 'season-post-aqi';
        if (elId) animateCounter(elId, Math.round(s.avg_aqi));
    });
    const tbody = document.querySelector('#seasonal-table tbody');
    if (tbody) {
        tbody.innerHTML = data.map((s) => `<tr>
            <td><strong>${s.season}</strong></td><td>${s.avg_pm25}</td><td>${s.avg_pm10}</td>
            <td>${s.avg_no2}</td><td>${s.avg_so2}</td><td>${s.avg_temp}°C</td>
            <td>${s.avg_humidity}%</td><td>${s.total_rainfall} mm</td><td>${s.days_count}</td>
        </tr>`).join('');
    }
}

// ---------------------------------------------------------------------------
// Weather Stats
// ---------------------------------------------------------------------------
function populateWeatherStats() {
    const data = window.airpulse.daily;
    const rainyDays = data.filter((d) => d.precipitation > 0);
    const dryDays = data.filter((d) => d.precipitation === 0);
    const rainyAvg = rainyDays.length ? (rainyDays.reduce((s, d) => s + d.pm25, 0) / rainyDays.length).toFixed(1) : 0;
    const dryAvg = dryDays.length ? (dryDays.reduce((s, d) => s + d.pm25, 0) / dryDays.length).toFixed(1) : 0;
    setText('rainy-pm25', rainyAvg);
    setText('dry-pm25', dryAvg);
    setText('rainy-days-count', rainyDays.length);
    setText('dry-days-count', dryDays.length);
    setText('rain-reduction', dryAvg > 0 ? Math.round(((dryAvg - rainyAvg) / dryAvg) * 100) + '%' : '--');
    setCorr('corr-temp', pearsonR(data.map((d) => d.temp_mean), data.map((d) => d.pm25)));
    setCorr('corr-humidity', pearsonR(data.map((d) => d.humidity), data.map((d) => d.pm25)));
    setCorr('corr-wind', pearsonR(data.map((d) => d.wind_speed), data.map((d) => d.pm25)));
}

function setCorr(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value.toFixed(3);
    el.className = 'corr-value ' + (value < 0 ? 'negative' : 'positive');
}
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

// ---------------------------------------------------------------------------
// Pearson Correlation
// ---------------------------------------------------------------------------
function pearsonR(x, y) {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        const xi = x[i] || 0, yi = y[i] || 0;
        sumX += xi; sumY += yi; sumXY += xi * yi; sumX2 += xi * xi; sumY2 += yi * yi;
    }
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return den === 0 ? 0 : (n * sumXY - sumX * sumY) / den;
}

// ---------------------------------------------------------------------------
// Chart.js Global Defaults
// ---------------------------------------------------------------------------
function setupChartDefaults() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15,23,42,0.95)';
    Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
    Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 5;
    Chart.defaults.animation.duration = 800;
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
async function initApp() {
    setupChartDefaults();
    setupNavigation();
    const ok = await loadAllData();
    if (!ok) return;
    populateKPIs();
    populateWorstDaysTable();
    populateSeasonalSummary();
    populateWeatherStats();
    initChartsForPage('overview');
    if (typeof initPredictionModel === 'function') initPredictionModel();
    if (typeof initAgent === 'function') initAgent();
    setTimeout(() => document.getElementById('loadingScreen').classList.add('hidden'), 500);
}

document.addEventListener('DOMContentLoaded', initApp);
