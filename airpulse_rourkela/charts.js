/**
 * charts.js — Chart.js Visualizations
 * =====================================
 * Creates all charts for the 3 main dashboard pages.
 * Charts are lazily initialized when their page is first shown.
 */

// Store chart instances for cleanup
const chartInstances = {};

// AQI color palette
const AQI_COLORS = {
    'Good': '#4CAF50',
    'Satisfactory': '#8BC34A',
    'Moderate': '#FFC107',
    'Poor': '#FF9800',
    'Very Poor': '#F44336',
    'Severe': '#9C27B0',
};

// ---------------------------------------------------------------------------
// Lazy Chart Initialization
// ---------------------------------------------------------------------------
function initChartsForPage(pageId) {
    const state = window.airpulse.chartsInitialized;
    if (pageId === 'overview' && !state.overview) {
        createTimeSeriesChart('pm25');
        createAQIDonutChart();
        state.overview = true;
    } else if (pageId === 'weather' && !state.weather) {
        createScatterCharts();
        createCorrBarsChart();
        state.weather = true;
    } else if (pageId === 'seasonal' && !state.seasonal) {
        createSeasonalBarsChart();
        createMonthlyBarsChart();
        state.seasonal = true;
    } else if (pageId === 'prediction' && !state.prediction) {
        if (typeof initPredictionCharts === 'function') initPredictionCharts();
    }
}

// ---------------------------------------------------------------------------
// Page 1: PM2.5 Time Series with Rolling Average
// ---------------------------------------------------------------------------
function createTimeSeriesChart(metric) {
    const data = window.airpulse.daily;
    const labels = data.map((d) => d.date);
    const values = data.map((d) => d[metric] || 0);

    // Compute 7-day rolling average
    const rolling = [];
    for (let i = 0; i < values.length; i++) {
        if (i < 6) { rolling.push(null); continue; }
        let sum = 0;
        for (let j = i - 6; j <= i; j++) sum += values[j];
        rolling.push(+(sum / 7).toFixed(1));
    }

    // AQI band thresholds for PM2.5
    const metricLabel = metric === 'pm25' ? 'PM2.5 (μg/m³)' : metric === 'pm10' ? 'PM10 (μg/m³)' : 'AQI Value';

    if (chartInstances.timeseries) chartInstances.timeseries.destroy();

    const ctx = document.getElementById('chart-timeseries').getContext('2d');
    chartInstances.timeseries = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: metricLabel,
                    data: values,
                    borderColor: 'rgba(59, 130, 246, 0.5)',
                    backgroundColor: 'rgba(59, 130, 246, 0.03)',
                    fill: true,
                    borderWidth: 1.2,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                },
                {
                    label: '7-Day Average',
                    data: rolling,
                    borderColor: '#ec4899',
                    borderWidth: 2.5,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    type: 'category',
                    ticks: {
                        maxTicksLimit: 12,
                        callback: function (val, i) {
                            const date = new Date(this.getLabelForValue(val));
                            return date.toLocaleDateString('en-IN', { month: 'short' });
                        },
                    },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: metricLabel },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const date = new Date(items[0].label);
                            return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                        },
                    },
                },
            },
            interaction: { mode: 'index', intersect: false },
        },
    });

    // Toggle buttons
    const toggle = document.getElementById('overview-toggle');
    if (toggle && !toggle.dataset.bound) {
        toggle.dataset.bound = 'true';
        toggle.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            toggle.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
            e.target.classList.add('active');
            createTimeSeriesChart(e.target.dataset.metric);
        });
    }
}

// ---------------------------------------------------------------------------
// Page 1: AQI Donut Chart
// ---------------------------------------------------------------------------
function createAQIDonutChart() {
    const data = window.airpulse.aqi;
    const order = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'];
    const sorted = order.filter((c) => data.some((d) => d.aqi_category === c));
    const counts = sorted.map((c) => {
        const row = data.find((d) => d.aqi_category === c);
        return row ? row.days_count : 0;
    });
    const colors = sorted.map((c) => AQI_COLORS[c] || '#999');

    if (chartInstances.donut) chartInstances.donut.destroy();

    const ctx = document.getElementById('chart-aqi-donut').getContext('2d');
    chartInstances.donut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sorted,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderColor: 'rgba(6, 11, 24, 0.8)',
                borderWidth: 3,
                hoverOffset: 8,
            }],
        },
        options: {
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 12, font: { size: 11 } },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw} days (${((ctx.raw / 365) * 100).toFixed(1)}%)`,
                    },
                },
            },
        },
        plugins: [{
            id: 'centerText',
            beforeDraw(chart) {
                const { width, height, ctx } = chart;
                ctx.save();
                const fontSize = (height / 8).toFixed(0);
                ctx.font = `800 ${fontSize}px Inter, sans-serif`;
                ctx.fillStyle = '#f1f5f9';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('365', width / 2, height / 2 - 6);
                ctx.font = `500 ${(fontSize * 0.4).toFixed(0)}px Inter, sans-serif`;
                ctx.fillStyle = '#64748b';
                ctx.fillText('Total Days', width / 2, height / 2 + 16);
                ctx.restore();
            },
        }],
    });
}

// ---------------------------------------------------------------------------
// Page 2: Scatter Plots (Temperature, Humidity, Wind vs PM2.5)
// ---------------------------------------------------------------------------
function createScatterCharts() {
    const data = window.airpulse.daily;

    const configs = [
        { id: 'chart-scatter-temp', xKey: 'temp_mean', label: 'Temperature (°C)', color: '#ec4899' },
        { id: 'chart-scatter-humidity', xKey: 'humidity', label: 'Humidity (%)', color: '#3b82f6' },
        { id: 'chart-scatter-wind', xKey: 'wind_speed', label: 'Wind Speed (km/h)', color: '#10b981' },
    ];

    configs.forEach((cfg) => {
        const points = data.map((d) => ({ x: d[cfg.xKey], y: d.pm25 })).filter((p) => p.x != null && p.y != null);

        // Compute trend line
        const xs = points.map((p) => p.x);
        const ys = points.map((p) => p.y);
        const n = xs.length;
        const sumX = xs.reduce((a, b) => a + b, 0);
        const sumY = ys.reduce((a, b) => a + b, 0);
        const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
        const sumX2 = xs.reduce((a, x) => a + x * x, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const xMin = Math.min(...xs);
        const xMax = Math.max(...xs);

        if (chartInstances[cfg.id]) chartInstances[cfg.id].destroy();

        const ctx = document.getElementById(cfg.id).getContext('2d');
        chartInstances[cfg.id] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Daily Data',
                        data: points,
                        backgroundColor: cfg.color + '55',
                        borderColor: cfg.color,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        borderWidth: 1,
                    },
                    {
                        label: 'Trend',
                        data: [
                            { x: xMin, y: slope * xMin + intercept },
                            { x: xMax, y: slope * xMax + intercept },
                        ],
                        type: 'line',
                        borderColor: '#f1f5f9',
                        borderWidth: 2,
                        borderDash: [6, 3],
                        pointRadius: 0,
                        fill: false,
                    },
                ],
            },
            options: {
                scales: {
                    x: {
                        title: { display: true, text: cfg.label },
                        grid: { color: 'rgba(255,255,255,0.04)' },
                    },
                    y: {
                        title: { display: true, text: 'PM2.5 (μg/m³)' },
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        beginAtZero: true,
                    },
                },
                plugins: {
                    legend: { display: false },
                },
            },
        });
    });
}

// ---------------------------------------------------------------------------
// Page 2: Correlation Bars
// ---------------------------------------------------------------------------
function createCorrBarsChart() {
    const data = window.airpulse.daily;
    const vars = [
        { key: 'temp_mean', label: 'Temperature' },
        { key: 'humidity', label: 'Humidity' },
        { key: 'wind_speed', label: 'Wind Speed' },
        { key: 'precipitation', label: 'Precipitation' },
        { key: 'visibility', label: 'Visibility' },
    ];

    const pm25 = data.map((d) => d.pm25);
    const correlations = vars.map((v) => ({
        label: v.label,
        value: pearsonR(data.map((d) => d[v.key] || 0), pm25),
    }));

    const colors = correlations.map((c) =>
        c.value < 0 ? 'rgba(20, 184, 166, 0.7)' : 'rgba(244, 63, 94, 0.7)'
    );

    if (chartInstances.corrBars) chartInstances.corrBars.destroy();

    const ctx = document.getElementById('chart-corr-bars').getContext('2d');
    chartInstances.corrBars = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: correlations.map((c) => c.label),
            datasets: [{
                label: 'Correlation with PM2.5',
                data: correlations.map((c) => +c.value.toFixed(3)),
                backgroundColor: colors,
                borderColor: colors.map((c) => c.replace('0.7', '1')),
                borderWidth: 1,
                borderRadius: 6,
            }],
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    min: -1, max: 1,
                    title: { display: true, text: 'Pearson r' },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
                y: {
                    grid: { display: false },
                },
            },
            plugins: { legend: { display: false } },
        },
    });
}

// ---------------------------------------------------------------------------
// Page 3: Seasonal Pollutant Comparison (Grouped Bar)
// ---------------------------------------------------------------------------
function createSeasonalBarsChart() {
    const data = window.airpulse.seasonal;
    const order = ['Winter', 'Summer', 'Monsoon', 'Post-Monsoon'];
    const sorted = order.map((s) => data.find((d) => d.season === s)).filter(Boolean);

    const pollutants = [
        { key: 'avg_pm25', label: 'PM2.5', color: '#F44336' },
        { key: 'avg_pm10', label: 'PM10', color: '#FF9800' },
        { key: 'avg_no2', label: 'NO₂', color: '#3b82f6' },
        { key: 'avg_so2', label: 'SO₂', color: '#FFC107' },
        { key: 'avg_o3', label: 'O₃', color: '#4CAF50' },
    ];

    if (chartInstances.seasonalBars) chartInstances.seasonalBars.destroy();

    const ctx = document.getElementById('chart-seasonal-bars').getContext('2d');
    chartInstances.seasonalBars = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map((s) => s.season),
            datasets: pollutants.map((p) => ({
                label: p.label,
                data: sorted.map((s) => s[p.key]),
                backgroundColor: p.color + 'cc',
                borderColor: p.color,
                borderWidth: 1,
                borderRadius: 4,
            })),
        },
        options: {
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Concentration (μg/m³)' },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
            },
            plugins: {
                legend: { position: 'top' },
            },
        },
    });
}

// ---------------------------------------------------------------------------
// Page 3: Monthly PM2.5 Trend (Bar chart with color coding)
// ---------------------------------------------------------------------------
function createMonthlyBarsChart() {
    const data = window.airpulse.monthly;
    const monthLabels = data.map((d) => {
        const parts = (d.month || '').split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return parts.length === 2 ? months[parseInt(parts[1]) - 1] : d.month;
    });

    // Color based on AQI level
    const barColors = data.map((d) => {
        const pm = d.avg_pm25;
        if (pm <= 30) return AQI_COLORS['Good'];
        if (pm <= 60) return AQI_COLORS['Satisfactory'];
        if (pm <= 90) return AQI_COLORS['Moderate'];
        if (pm <= 120) return AQI_COLORS['Poor'];
        return AQI_COLORS['Very Poor'];
    });

    if (chartInstances.monthlyBars) chartInstances.monthlyBars.destroy();

    const ctx = document.getElementById('chart-monthly-bars').getContext('2d');
    chartInstances.monthlyBars = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Avg PM2.5',
                data: data.map((d) => d.avg_pm25),
                backgroundColor: barColors.map((c) => c + 'cc'),
                borderColor: barColors,
                borderWidth: 1,
                borderRadius: 6,
            }],
        },
        options: {
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Avg PM2.5 (μg/m³)' },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => {
                            const row = data[ctx.dataIndex];
                            return `Max: ${row.max_pm25} | Min: ${row.min_pm25}`;
                        },
                    },
                },
            },
        },
    });
}
