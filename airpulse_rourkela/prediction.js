/**
 * prediction.js — Client-Side Linear Regression + Prediction Charts
 * ===================================================================
 * Multiple linear regression trained on 365 days of Rourkela data.
 * Includes comparison chart and sensitivity analysis chart.
 * No API keys — runs 100% in the browser.
 */

// ---------------------------------------------------------------------------
// Model State
// ---------------------------------------------------------------------------
let modelCoefficients = null;
let modelR2 = null;
const chartInstances_pred = {};

// ---------------------------------------------------------------------------
// Matrix Utilities
// ---------------------------------------------------------------------------
function matTranspose(A) {
    const rows = A.length, cols = A[0].length;
    const T = Array.from({ length: cols }, () => new Array(rows));
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) T[j][i] = A[i][j];
    return T;
}
function matMultiply(A, B) {
    const aRows = A.length, aCols = A[0].length, bCols = B[0].length;
    const C = Array.from({ length: aRows }, () => new Array(bCols).fill(0));
    for (let i = 0; i < aRows; i++) for (let j = 0; j < bCols; j++) for (let k = 0; k < aCols; k++) C[i][j] += A[i][k] * B[k][j];
    return C;
}
function matInverse(matrix) {
    const n = matrix.length;
    const aug = matrix.map((row, i) => { const ext = new Array(n).fill(0); ext[i] = 1; return [...row, ...ext]; });
    for (let col = 0; col < n; col++) {
        let maxRow = col;
        for (let row = col + 1; row < n; row++) if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
        [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
        const pivot = aug[col][col];
        if (Math.abs(pivot) < 1e-10) return null;
        for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = aug[row][col];
            for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
        }
    }
    return aug.map((row) => row.slice(n));
}
function matVecMultiply(A, v) { return A.map((row) => row.reduce((s, a, i) => s + a * v[i], 0)); }

// ---------------------------------------------------------------------------
// Season Encoding
// ---------------------------------------------------------------------------
function encodeSeason(season) {
    return [season === 'Summer' ? 1 : 0, season === 'Monsoon' ? 1 : 0, season === 'Post-Monsoon' ? 1 : 0];
}

// ---------------------------------------------------------------------------
// Train Model
// ---------------------------------------------------------------------------
function trainModel(data) {
    const X = [], y = [];
    data.forEach((d) => {
        if (d.pm25 == null || d.temp_mean == null) return;
        X.push([1, d.temp_mean, d.humidity, d.wind_speed, d.precipitation, ...encodeSeason(d.season)]);
        y.push(d.pm25);
    });
    const n = X.length;
    const Xt = matTranspose(X);
    const XtX = matMultiply(Xt, X);
    const XtX_inv = matInverse(XtX);
    if (!XtX_inv) { console.error('Matrix singular'); return null; }
    const Xty = Xt.map((row) => row.reduce((s, val, i) => s + val * y[i], 0));
    const beta = matVecMultiply(XtX_inv, Xty);
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
        const yPred = X[i].reduce((s, x, j) => s + x * beta[j], 0);
        ssRes += (y[i] - yPred) ** 2;
        ssTot += (y[i] - yMean) ** 2;
    }
    return { coefficients: beta, r2: 1 - ssRes / ssTot, samples: n };
}

// ---------------------------------------------------------------------------
// Predict
// ---------------------------------------------------------------------------
function predictPM25(temp, humidity, wind, precip, season) {
    if (!modelCoefficients) return null;
    const features = [1, temp, humidity, wind, precip, ...encodeSeason(season)];
    return Math.max(8, Math.min(400, features.reduce((s, x, i) => s + x * modelCoefficients[i], 0)));
}

function computeAQI(pm25) {
    const bp = [[0,30,0,50],[31,60,51,100],[61,90,101,200],[91,120,201,300],[121,250,301,400],[251,500,401,500]];
    for (const [cL, cH, iL, iH] of bp) {
        if (pm25 >= cL && pm25 <= cH) return Math.round(((iH - iL) / (cH - cL)) * (pm25 - cL) + iL);
    }
    return pm25 > 500 ? 500 : 0;
}
function getAQICategory(pm25) {
    if (pm25 <= 30) return 'Good'; if (pm25 <= 60) return 'Satisfactory';
    if (pm25 <= 90) return 'Moderate'; if (pm25 <= 120) return 'Poor';
    if (pm25 <= 250) return 'Very Poor'; return 'Severe';
}
function getAQIColor(cat) {
    return { Good:'#4CAF50', Satisfactory:'#8BC34A', Moderate:'#FFC107', Poor:'#FF9800', 'Very Poor':'#F44336', Severe:'#9C27B0' }[cat] || '#999';
}
function getHealthAdvisory(cat) {
    return {
        Good: 'Air quality is excellent! Perfect for outdoor activities. Enjoy the fresh air.',
        Satisfactory: 'Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion.',
        Moderate: 'People with respiratory conditions should reduce outdoor exercise. Consider wearing a mask.',
        Poor: 'Everyone should limit outdoor activities. Use air purifiers indoors. Wear N95 masks outside.',
        'Very Poor': 'Avoid outdoor activities. Stay indoors with air purifiers. Wear N95 masks if going outside.',
        Severe: 'HEALTH EMERGENCY — Do not go outside. Seal windows. Run air purifiers at max.',
    }[cat] || 'No advisory.';
}

// ---------------------------------------------------------------------------
// Initialize Model
// ---------------------------------------------------------------------------
function initPredictionModel() {
    const data = window.airpulse.daily;
    if (!data || !data.length) return;
    const result = trainModel(data);
    if (!result) return;
    modelCoefficients = result.coefficients;
    modelR2 = result.r2;
    setText('model-r2', result.r2.toFixed(3));
    setText('model-samples', result.samples);
    console.log(`✅ Prediction model trained: R²=${result.r2.toFixed(4)}`);
    setupSliderListeners();
}

function setupSliderListeners() {
    [['slider-temp','val-temp'],['slider-humidity','val-humidity'],['slider-wind','val-wind'],['slider-precip','val-precip']].forEach(([sid, did]) => {
        const s = document.getElementById(sid);
        if (s) s.addEventListener('input', () => { const d = document.getElementById(did); if (d) d.textContent = s.value; });
    });
}

// ---------------------------------------------------------------------------
// Run Prediction (from button)
// ---------------------------------------------------------------------------
function runPrediction() {
    const temp = parseFloat(document.getElementById('slider-temp').value);
    const humidity = parseFloat(document.getElementById('slider-humidity').value);
    const wind = parseFloat(document.getElementById('slider-wind').value);
    const precip = parseFloat(document.getElementById('slider-precip').value);
    const season = document.getElementById('select-season').value;

    const pm25 = predictPM25(temp, humidity, wind, precip, season);
    if (pm25 === null) return;

    const aqi = computeAQI(pm25);
    const category = getAQICategory(pm25);
    const color = getAQIColor(category);
    const pm10 = (pm25 * (1.6 + Math.random() * 0.2)).toFixed(1);

    document.getElementById('pred-pm25').textContent = pm25.toFixed(1);
    document.getElementById('pred-pm10').textContent = pm10;
    document.getElementById('pred-aqi').textContent = aqi;

    const catEl = document.getElementById('pred-category');
    catEl.textContent = category;
    catEl.style.background = color + '22';
    catEl.style.color = color;

    document.getElementById('pred-advisory-text').textContent = getHealthAdvisory(category);
    document.getElementById('pred-advisory').style.borderLeftColor = color;

    updateGauge(aqi, color);
    createComparisonChart(pm25, season);
    createSensitivityChart(temp, humidity, wind, precip, season);

    const btn = document.getElementById('btn-predict');
    btn.textContent = '✅ Updated!';
    setTimeout(() => { btn.textContent = '🔮 Predict Air Quality'; }, 1200);
}

// ---------------------------------------------------------------------------
// Gauge
// ---------------------------------------------------------------------------
function updateGauge(aqi, color) {
    const fill = document.getElementById('gauge-fill'), val = document.getElementById('gauge-value');
    if (!fill || !val) return;
    const offset = 267 * (1 - Math.min(aqi / 500, 1));
    fill.style.strokeDashoffset = offset;
    fill.style.stroke = color;
    val.textContent = aqi;
    val.style.fill = color;
}

// ---------------------------------------------------------------------------
// Comparison Chart: Prediction vs Seasonal Averages
// ---------------------------------------------------------------------------
function createComparisonChart(predictedPM25, selectedSeason) {
    const seasonal = window.airpulse.seasonal;
    const seasons = ['Winter', 'Summer', 'Monsoon', 'Post-Monsoon'];
    const avgValues = seasons.map((s) => {
        const row = seasonal.find((d) => d.season === s);
        return row ? row.avg_pm25 : 0;
    });

    const labels = [...seasons, 'Your Prediction'];
    const values = [...avgValues, +predictedPM25.toFixed(1)];
    const colors = seasons.map((s) => {
        const pm = avgValues[seasons.indexOf(s)];
        return getAQIColor(getAQICategory(pm)) + 'cc';
    });
    colors.push(getAQIColor(getAQICategory(predictedPM25)));

    const borderColors = colors.map((c) => c.replace('cc', 'ff').replace(/22$/, ''));

    if (chartInstances_pred.comparison) chartInstances_pred.comparison.destroy();
    const ctx = document.getElementById('chart-pred-comparison');
    if (!ctx) return;
    chartInstances_pred.comparison = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Avg PM2.5 (μg/m³)',
                data: values,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8,
            }],
        },
        options: {
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, title: { display: true, text: 'PM2.5 (μg/m³)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { afterLabel: (ctx) => ctx.dataIndex === 4 ? '⭐ Your prediction' : `${labels[ctx.dataIndex]} season average` } },
            },
        },
    });
}

// ---------------------------------------------------------------------------
// Sensitivity Chart: How PM2.5 changes as one variable sweeps
// ---------------------------------------------------------------------------
function createSensitivityChart(temp, humidity, wind, precip, season) {
    // Show 4 lines: sweep each variable while holding others constant
    const N = 20;
    const tempRange = linspace(5, 45, N);
    const humRange = linspace(10, 100, N);
    const windRange = linspace(0.5, 25, N);
    const precRange = linspace(0, 40, N);

    const tempLine = tempRange.map((t) => predictPM25(t, humidity, wind, precip, season));
    const humLine = humRange.map((h) => predictPM25(temp, h, wind, precip, season));
    const windLine = windRange.map((w) => predictPM25(temp, humidity, w, precip, season));
    const precLine = precRange.map((p) => predictPM25(temp, humidity, wind, p, season));

    if (chartInstances_pred.sensitivity) chartInstances_pred.sensitivity.destroy();
    const ctx = document.getElementById('chart-sensitivity');
    if (!ctx) return;

    chartInstances_pred.sensitivity = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: Array.from({ length: N }, (_, i) => i),
            datasets: [
                { label: 'Temperature (5→45°C)', data: tempLine, borderColor: '#ec4899', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 4 },
                { label: 'Humidity (10→100%)', data: humLine, borderColor: '#3b82f6', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 4 },
                { label: 'Wind (0.5→25 km/h)', data: windLine, borderColor: '#10b981', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 4 },
                { label: 'Precipitation (0→40mm)', data: precLine, borderColor: '#06b6d4', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 4 },
            ],
        },
        options: {
            scales: {
                x: { display: false },
                y: { beginAtZero: true, title: { display: true, text: 'Predicted PM2.5' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            },
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 10 } },
                tooltip: {
                    callbacks: {
                        title: () => 'Sensitivity Analysis',
                        label: (ctx) => `${ctx.dataset.label}: PM2.5 = ${ctx.raw?.toFixed(1)} μg/m³`,
                    },
                },
            },
            interaction: { mode: 'index', intersect: false },
        },
    });
}

function linspace(start, end, n) {
    const step = (end - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => +(start + i * step).toFixed(2));
}

// Lazy init prediction charts
function initPredictionCharts() {
    if (!window.airpulse.chartsInitialized.prediction && modelCoefficients) {
        // Show initial charts with default values
        const pm25 = predictPM25(25, 55, 6, 0, 'Monsoon');
        if (pm25 !== null) {
            createComparisonChart(pm25, 'Monsoon');
            createSensitivityChart(25, 55, 6, 0, 'Monsoon');
        }
        window.airpulse.chartsInitialized.prediction = true;
    }
}
