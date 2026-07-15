/**
 * agent.js — AirPulse AI Assistant
 * ==================================
 * Rule-based NLP chat agent that answers questions about Rourkela's air quality.
 * No API keys — runs 100% client-side using pattern matching + data lookups.
 * Supports 30+ question types with intelligent data-driven responses.
 */

// ---------------------------------------------------------------------------
// Agent State
// ---------------------------------------------------------------------------
let agentReady = false;

// ---------------------------------------------------------------------------
// Initialize Agent
// ---------------------------------------------------------------------------
function initAgent() {
    agentReady = true;
    console.log('✅ AI Agent initialized');
}

// ---------------------------------------------------------------------------
// Floating Chat Toggle
// ---------------------------------------------------------------------------
function toggleChat() {
    const panel = document.getElementById('chatPanel');
    const fab = document.getElementById('chatFab');
    if (!panel || !fab) return;
    const isOpen = panel.classList.toggle('open');
    fab.classList.toggle('open', isOpen);
    fab.textContent = isOpen ? '✕' : '🤖';
    if (isOpen) {
        setTimeout(() => document.getElementById('chat-input')?.focus(), 300);
    }
}

// ---------------------------------------------------------------------------
// Send Chat (called from UI)
// ---------------------------------------------------------------------------
function sendChat() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    showTyping();

    // Simulate thinking delay
    setTimeout(() => {
        hideTyping();
        const response = processQuery(message);
        addMessage(response, 'bot');
    }, 600 + Math.random() * 800);
}

function askAgent(message) {
    document.getElementById('chat-input').value = message;
    sendChat();
}

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------
function addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const avatar = sender === 'bot' ? '🤖' : '👤';

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.innerHTML = `
        <div class="chat-avatar">${avatar}</div>
        <div class="chat-bubble">${text}</div>
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chat-messages');
    const typing = document.createElement('div');
    typing.className = 'chat-message bot';
    typing.id = 'typing-indicator';
    typing.innerHTML = `
        <div class="chat-avatar">🤖</div>
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

// ---------------------------------------------------------------------------
// Query Processing Engine
// ---------------------------------------------------------------------------
function processQuery(input) {
    const q = input.toLowerCase().replace(/[?!.,;:'"]/g, '').trim();
    const data = window.airpulse;

    if (!data.loaded) {
        return 'Sorry, data is still loading. Please wait a moment and try again.';
    }

    // --- Match patterns in priority order ---

    // Greetings
    if (matches(q, ['hello', 'hi ', 'hey', 'good morning', 'good evening', 'namaste'])) {
        return 'Hello! 👋 I\'m the <strong>AirPulse Assistant</strong>. Ask me anything about Rourkela\'s air quality — trends, seasons, weather impact, health tips, and more!';
    }

    // Help
    if (matches(q, ['help', 'what can you do', 'what do you know', 'commands'])) {
        return `I can help with many topics! Try asking:<br>
        • <span class="highlight">What was the worst/best month?</span><br>
        • <span class="highlight">How does rain affect pollution?</span><br>
        • <span class="highlight">Compare winter vs monsoon</span><br>
        • <span class="highlight">What is AQI?</span><br>
        • <span class="highlight">Show AQI breakdown</span><br>
        • <span class="highlight">Health tips</span><br>
        • <span class="highlight">Tell me about Rourkela</span><br>
        • <span class="highlight">What is PM2.5?</span>`;
    }

    // What is AQI
    if (matches(q, ['what is aqi', 'aqi meaning', 'define aqi', 'aqi stand for', 'air quality index'])) {
        return `<strong>AQI (Air Quality Index)</strong> is a standardized scale that communicates how polluted the air is. India uses the <strong>National Air Quality Index (NAQI)</strong> with 6 categories:<br><br>
        🟢 <strong>Good (0-50)</strong> — Minimal impact<br>
        🟡 <strong>Satisfactory (51-100)</strong> — Minor discomfort for sensitive people<br>
        🟠 <strong>Moderate (101-200)</strong> — Breathing discomfort for sensitive groups<br>
        🔴 <strong>Poor (201-300)</strong> — Breathing discomfort for most people<br>
        🔴 <strong>Very Poor (301-400)</strong> — Respiratory illness on prolonged exposure<br>
        🟣 <strong>Severe (401-500)</strong> — Health emergency`;
    }

    // What is PM2.5
    if (matches(q, ['what is pm25', 'what is pm2.5', 'pm 2.5', 'particulate matter', 'what are pm'])) {
        return `<strong>PM2.5</strong> refers to fine particulate matter with a diameter of <strong>2.5 micrometers or less</strong> — about 30 times thinner than a human hair! 🔬<br><br>
        These tiny particles can penetrate deep into the lungs and even enter the bloodstream, causing serious health problems including heart disease, lung cancer, and respiratory infections.<br><br>
        In Rourkela, the annual average PM2.5 is <strong>${getAvg('pm25')} μg/m³</strong>, which is above the WHO guideline of 15 μg/m³.`;
    }

    // Worst month
    if (matches(q, ['worst month', 'most polluted month', 'highest pollution month', 'bad month', 'dirtiest month'])) {
        const monthly = data.monthly;
        const worst = [...monthly].sort((a, b) => b.avg_pm25 - a.avg_pm25)[0];
        const monthName = formatMonth(worst.month);
        return `📊 The <strong>worst month</strong> was <span class="highlight">${monthName}</span> with:<br>
        • Avg PM2.5: <strong>${worst.avg_pm25} μg/m³</strong><br>
        • Max PM2.5: <strong>${worst.max_pm25} μg/m³</strong><br>
        • Avg AQI: <strong>${worst.avg_aqi}</strong><br><br>
        Winter months (Dec-Feb) see the highest pollution due to <strong>temperature inversion</strong> and <strong>crop burning</strong> in neighboring regions.`;
    }

    // Best month
    if (matches(q, ['best month', 'cleanest month', 'least polluted', 'good month', 'clean month'])) {
        const monthly = data.monthly;
        const best = [...monthly].sort((a, b) => a.avg_pm25 - b.avg_pm25)[0];
        const monthName = formatMonth(best.month);
        return `🌿 The <strong>cleanest month</strong> was <span class="highlight">${monthName}</span> with:<br>
        • Avg PM2.5: <strong>${best.avg_pm25} μg/m³</strong><br>
        • Min PM2.5: <strong>${best.min_pm25} μg/m³</strong><br>
        • Avg AQI: <strong>${best.avg_aqi}</strong><br><br>
        Monsoon rains during Jul-Aug effectively <strong>wash out</strong> airborne pollutants, resulting in the cleanest air of the year! 🌧️`;
    }

    // Worst day
    if (matches(q, ['worst day', 'most polluted day', 'highest pm25', 'peak pollution', 'highest aqi'])) {
        const worst = data.worst[0];
        if (worst) {
            const dateStr = new Date(worst.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            return `🚨 The <strong>most polluted day</strong> was <span class="highlight">${dateStr}</span>:<br>
            • PM2.5: <strong>${worst.pm25} μg/m³</strong><br>
            • AQI: <strong>${worst.aqi}</strong> (${worst.aqi_category})<br>
            • Temperature: ${worst.temp_mean}°C<br>
            • Wind Speed: ${worst.wind_speed} km/h<br>
            • Humidity: ${worst.humidity}%<br><br>
            Low wind speed and cold temperatures trapped pollutants near the surface.`;
        }
        return 'Data not available for worst day analysis.';
    }

    // Rain impact
    if (matches(q, ['rain', 'precipitation', 'rain affect', 'rain impact', 'rain pollution', 'rain wash', 'rainfall'])) {
        const daily = data.daily;
        const rainy = daily.filter((d) => d.precipitation > 0);
        const dry = daily.filter((d) => d.precipitation === 0);
        const rainyAvg = (rainy.reduce((s, d) => s + d.pm25, 0) / rainy.length).toFixed(1);
        const dryAvg = (dry.reduce((s, d) => s + d.pm25, 0) / dry.length).toFixed(1);
        const reduction = ((1 - rainyAvg / dryAvg) * 100).toFixed(0);

        return `🌧️ <strong>Rain significantly reduces air pollution!</strong><br><br>
        • Rainy days (${rainy.length} days): Avg PM2.5 = <strong>${rainyAvg} μg/m³</strong><br>
        • Dry days (${dry.length} days): Avg PM2.5 = <strong>${dryAvg} μg/m³</strong><br>
        • Reduction: <span class="highlight">${reduction}% lower on rainy days</span><br><br>
        Raindrops physically capture and wash out suspended particles from the atmosphere — a process called <strong>wet deposition</strong> or "rain washout." 💧`;
    }

    // Temperature effect
    if (matches(q, ['temperature', 'temp affect', 'temp effect', 'heat pollution', 'cold pollution', 'temperature inversion'])) {
        const r = pearsonR(data.daily.map((d) => d.temp_mean), data.daily.map((d) => d.pm25));
        return `🌡️ <strong>Temperature has a notable inverse relationship with pollution.</strong><br><br>
        Pearson correlation (Temp vs PM2.5): <span class="highlight">r = ${r.toFixed(3)}</span><br><br>
        • <strong>Cold weather</strong> (winter): Temperature inversions trap pollutants near the ground, leading to high PM2.5<br>
        • <strong>Hot weather</strong> (summer): Greater atmospheric mixing disperses pollutants upward<br>
        • The strongest pollution occurs when temperatures drop below 20°C, especially in Dec-Feb`;
    }

    // Wind effect
    if (matches(q, ['wind', 'wind affect', 'wind effect', 'wind speed', 'breeze'])) {
        const r = pearsonR(data.daily.map((d) => d.wind_speed), data.daily.map((d) => d.pm25));
        return `💨 <strong>Higher wind speeds reduce pollution.</strong><br><br>
        Pearson correlation (Wind Speed vs PM2.5): <span class="highlight">r = ${r.toFixed(3)}</span><br><br>
        • Strong winds disperse and dilute airborne pollutants<br>
        • Calm days (wind < 3 km/h) often see the highest PM2.5 levels<br>
        • Monsoon winds from the Bay of Bengal bring clean, moist air to Rourkela`;
    }

    // Compare seasons / winter vs monsoon
    if (matches(q, ['compare', 'winter vs monsoon', 'monsoon vs winter', 'season comparison', 'compare season'])) {
        const seasonal = data.seasonal;
        const winter = seasonal.find((s) => s.season === 'Winter');
        const monsoon = seasonal.find((s) => s.season === 'Monsoon');
        if (winter && monsoon) {
            return `❄️ vs 🌧️ <strong>Winter vs Monsoon Comparison</strong>:<br><br>
            <table style="width:100%; font-size:0.82rem;">
            <tr><td></td><td><strong>Winter</strong></td><td><strong>Monsoon</strong></td></tr>
            <tr><td>Avg PM2.5</td><td>${winter.avg_pm25}</td><td>${monsoon.avg_pm25}</td></tr>
            <tr><td>Avg AQI</td><td>${winter.avg_aqi}</td><td>${monsoon.avg_aqi}</td></tr>
            <tr><td>Avg Temp</td><td>${winter.avg_temp}°C</td><td>${monsoon.avg_temp}°C</td></tr>
            <tr><td>Total Rain</td><td>${winter.total_rainfall} mm</td><td>${monsoon.total_rainfall} mm</td></tr>
            <tr><td>Days</td><td>${winter.days_count}</td><td>${monsoon.days_count}</td></tr>
            </table><br>
            Winter PM2.5 is <span class="highlight">${(winter.avg_pm25 / monsoon.avg_pm25).toFixed(1)}x higher</span> than monsoon! The combination of temperature inversion, low wind, and no rain makes winter the worst season.`;
        }
        return showSeasonSummary();
    }

    // AQI breakdown
    if (matches(q, ['aqi breakdown', 'aqi distribution', 'category distribution', 'how many days', 'good days', 'category'])) {
        const breakdown = data.aqi;
        const rows = breakdown.map((d) =>
            `• <strong>${d.aqi_category}</strong>: ${d.days_count} days (${d.percentage}%) — Avg PM2.5: ${d.avg_pm25}`
        ).join('<br>');
        return `📊 <strong>AQI Category Distribution (365 days):</strong><br><br>${rows}<br><br>
        About <span class="highlight">${breakdown.find((d) => d.aqi_category === 'Good')?.percentage || 0}%</span> of days had Good air quality, mostly during the monsoon season.`;
    }

    // Health tips
    if (matches(q, ['health', 'health tip', 'safety', 'safe', 'mask', 'protect', 'should i go', 'outdoor'])) {
        return `💊 <strong>Health Tips for Rourkela Residents:</strong><br><br>
        🏠 <strong>During Winter (High Pollution)</strong>:<br>
        • Wear N95 masks outdoors<br>
        • Use air purifiers indoors (HEPA filter recommended)<br>
        • Avoid morning walks (pollution peaks at dawn)<br>
        • Keep windows closed, especially during foggy days<br><br>
        🌿 <strong>Year-Round Tips</strong>:<br>
        • Check AQI before outdoor exercise<br>
        • Plant indoor air-purifying plants (Snake Plant, Peace Lily)<br>
        • Stay hydrated — helps your body flush toxins<br>
        • Exercise outdoors during monsoon when air is cleanest<br>
        • Use the <span class="highlight">Live Prediction</span> tool on this page to check conditions!`;
    }

    // About Rourkela
    if (matches(q, ['rourkela', 'about rourkela', 'tell me about', 'city', 'where is', 'location'])) {
        return `🏙️ <strong>About Rourkela:</strong><br><br>
        Rourkela is a major <strong>steel city</strong> in the Sundargarh district of <strong>Odisha, India</strong> (22.26°N, 84.85°E).<br><br>
        Key facts:<br>
        • Home to <strong>Rourkela Steel Plant (RSP)</strong> — one of India's largest steel plants<br>
        • Population: ~5.5 lakh (2024 est.)<br>
        • Climate: Tropical with hot summers, heavy monsoon rains, and cool winters<br>
        • Major pollution sources: <strong>steel industry, vehicular emissions, construction, crop burning</strong><br>
        • Also home to <strong>NIT Rourkela</strong> — a premier engineering institute<br><br>
        The industrial activity and unfavorable winter weather combine to create significant air quality challenges. 🏭`;
    }

    // WHO guidelines
    if (matches(q, ['who guideline', 'who standard', 'who limit', 'world health', 'safe limit'])) {
        const avgPM = getAvg('pm25');
        return `🏛️ <strong>WHO Air Quality Guidelines (2021):</strong><br><br>
        • PM2.5 Annual Mean: <strong>5 μg/m³</strong> (target) / <strong>15 μg/m³</strong> (interim)<br>
        • PM2.5 24-hour Mean: <strong>15 μg/m³</strong> (target) / <strong>45 μg/m³</strong> (interim)<br>
        • PM10 Annual Mean: <strong>15 μg/m³</strong><br><br>
        Rourkela's annual average PM2.5 of <span class="highlight">${avgPM} μg/m³</span> exceeds the WHO guideline by <strong>${(avgPM / 15).toFixed(1)}x</strong>. Even the cleanest month (July) barely meets the interim target.`;
    }

    // Correlation
    if (matches(q, ['correlation', 'relationship', 'correlate', 'related'])) {
        const daily = data.daily;
        const pm = daily.map((d) => d.pm25);
        const rTemp = pearsonR(daily.map((d) => d.temp_mean), pm).toFixed(3);
        const rHum = pearsonR(daily.map((d) => d.humidity), pm).toFixed(3);
        const rWind = pearsonR(daily.map((d) => d.wind_speed), pm).toFixed(3);
        const rPrec = pearsonR(daily.map((d) => d.precipitation || 0), pm).toFixed(3);

        return `📈 <strong>Correlation with PM2.5 (Pearson r):</strong><br><br>
        • Temperature: <strong>${rTemp}</strong> ${rTemp < 0 ? '(negative — cold = more pollution)' : ''}<br>
        • Humidity: <strong>${rHum}</strong><br>
        • Wind Speed: <strong>${rWind}</strong> ${rWind < 0 ? '(negative — wind clears pollution)' : ''}<br>
        • Precipitation: <strong>${rPrec}</strong> ${rPrec < 0 ? '(negative — rain washes pollution)' : ''}<br><br>
        The <span class="highlight">strongest factors</span> reducing pollution are wind speed and precipitation.`;
    }

    // Data info
    if (matches(q, ['data', 'dataset', 'how much data', 'data range', 'data source', 'where data'])) {
        return `📁 <strong>Dataset Information:</strong><br><br>
        • <strong>Location</strong>: Rourkela, Odisha, India (22.26°N, 84.85°E)<br>
        • <strong>Period</strong>: January 1, 2024 – December 30, 2024<br>
        • <strong>Total days</strong>: 365<br>
        • <strong>Variables</strong>: PM2.5, PM10, SO₂, NO₂, O₃, CO, AQI, Temperature, Humidity, Wind Speed, Precipitation, Visibility, Google Search Interest<br>
        • <strong>Source</strong>: Synthetic data generated using seasonal patterns matching Rourkela's tropical climate with physics-based correlations<br>
        • <strong>AQI Standard</strong>: India National Air Quality Index (NAQI)`;
    }

    // Seasonal info (winter, summer, monsoon)
    if (matches(q, ['winter']) && !matches(q, ['vs', 'compar'])) {
        const s = data.seasonal.find((d) => d.season === 'Winter');
        if (s) return seasonResponse('❄️ Winter', s, 'Temperature inversion and crop burning make winter the most polluted season. Low wind speeds fail to disperse industrial emissions from the steel plant.');
    }
    if (matches(q, ['monsoon', 'rainy season']) && !matches(q, ['vs', 'compar'])) {
        const s = data.seasonal.find((d) => d.season === 'Monsoon');
        if (s) return seasonResponse('🌧️ Monsoon', s, 'Heavy rainfall washes out pollutants (wet deposition). Strong winds from the Bay of Bengal bring clean, moist air. This is the best season for air quality!');
    }
    if (matches(q, ['summer']) && !matches(q, ['vs', 'compar'])) {
        const s = data.seasonal.find((d) => d.season === 'Summer');
        if (s) return seasonResponse('☀️ Summer', s, 'Higher temperatures promote atmospheric mixing, dispersing pollutants. However, dust storms and construction activity can spike PM10 levels.');
    }
    if (matches(q, ['post monsoon', 'post-monsoon', 'autumn'])) {
        const s = data.seasonal.find((d) => d.season === 'Post-Monsoon');
        if (s) return seasonResponse('🍂 Post-Monsoon', s, 'As rain decreases, pollution starts building up again. Crop residue burning in neighboring states adds to the PM2.5 load.');
    }

    // Industry / steel plant
    if (matches(q, ['industry', 'industrial', 'steel', 'factory', 'rsp', 'emission'])) {
        return `🏭 <strong>Industrial Pollution in Rourkela:</strong><br><br>
        Rourkela hosts the <strong>Rourkela Steel Plant (RSP)</strong>, operated by SAIL — one of India's first integrated steel plants (established 1959).<br><br>
        Industrial emissions contribute significantly to:<br>
        • <strong>PM2.5 & PM10</strong> — from smelting and processing<br>
        • <strong>SO₂</strong> — from coal combustion and sulfur in iron ore<br>
        • <strong>NO₂</strong> — from high-temperature industrial processes<br>
        • <strong>CO</strong> — from blast furnaces<br><br>
        Combined with vehicular emissions and <strong>construction dust</strong>, the city faces persistent air quality challenges, especially during calm winter weather.`;
    }

    // Prediction
    if (matches(q, ['predict', 'forecast', 'tomorrow', 'future', 'what will', 'what if'])) {
        return `🔮 You can use the <strong>Live Prediction</strong> tool on this page!<br><br>
        Just adjust the weather sliders (temperature, humidity, wind speed, precipitation) and click <strong>"Predict Air Quality"</strong>.<br><br>
        The model uses <strong>multiple linear regression</strong> trained on 365 days of Rourkela data to estimate PM2.5 and AQI based on weather conditions. Try it! 👆`;
    }

    // Trends / Google Trends
    if (matches(q, ['trend', 'google trend', 'search interest', 'public awareness', 'awareness'])) {
        return `📈 <strong>Public Awareness Trends:</strong><br><br>
        Google search interest for air quality topics in Rourkela follows pollution patterns:<br>
        • <strong>Winter peaks</strong>: High search interest when AQI worsens (people searching for "AQI Rourkela", "air quality")<br>
        • <strong>Monsoon lows</strong>: Lower search interest when air is clean<br>
        • <strong>Spike events</strong>: Media coverage of extreme pollution days drives sudden search surges<br><br>
        This shows that public awareness is <strong>reactive</strong> — people become concerned when pollution is already high, rather than taking preventive action.`;
    }

    // Thanks
    if (matches(q, ['thank', 'thanks', 'thx', 'appreciate', 'great', 'awesome', 'nice', 'cool'])) {
        const replies = [
            'You\'re welcome! Happy to help! 😊 Feel free to ask more questions.',
            'Glad I could help! 🌟 Ask me anything else about Rourkela\'s air quality.',
            'Thank you! 💚 Stay aware of air quality and breathe safe!',
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    }

    // Average stats
    if (matches(q, ['average', 'mean', 'avg'])) {
        return `📊 <strong>Annual Averages (2024):</strong><br><br>
        • PM2.5: <strong>${getAvg('pm25')} μg/m³</strong><br>
        • PM10: <strong>${getAvg('pm10')} μg/m³</strong><br>
        • NO₂: <strong>${getAvg('no2')} μg/m³</strong><br>
        • SO₂: <strong>${getAvg('so2')} μg/m³</strong><br>
        • O₃: <strong>${getAvg('o3')} μg/m³</strong><br>
        • CO: <strong>${getAvg('co')} mg/m³</strong><br>
        • AQI: <strong>${getAvg('aqi')}</strong><br>
        • Temperature: <strong>${getAvg('temp_mean')}°C</strong>`;
    }

    // Fallback
    return `I'm not sure about that specific question, but I can help with:<br><br>
    • Air quality data analysis<br>
    • Weather impact on pollution<br>
    • Seasonal comparisons<br>
    • Health advisories<br>
    • AQI information<br><br>
    Try asking: <span class="highlight">"What was the worst month?"</span> or <span class="highlight">"How does rain affect pollution?"</span>`;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------
function matches(query, keywords) {
    return keywords.some((kw) => query.includes(kw));
}

function getAvg(field) {
    const data = window.airpulse.daily;
    if (!data.length) return '--';
    const avg = data.reduce((s, d) => s + (d[field] || 0), 0) / data.length;
    return field === 'co' ? avg.toFixed(2) : avg.toFixed(1);
}

function formatMonth(monthStr) {
    if (!monthStr) return monthStr;
    const parts = monthStr.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return parts.length === 2 ? months[parseInt(parts[1]) - 1] + ' ' + parts[0] : monthStr;
}

function seasonResponse(icon, s, insight) {
    return `${icon} <strong>${s.season} Season Analysis:</strong><br><br>
    • Avg PM2.5: <strong>${s.avg_pm25} μg/m³</strong><br>
    • Avg PM10: <strong>${s.avg_pm10} μg/m³</strong><br>
    • Avg AQI: <strong>${s.avg_aqi}</strong><br>
    • Avg Temperature: <strong>${s.avg_temp}°C</strong><br>
    • Avg Humidity: <strong>${s.avg_humidity}%</strong><br>
    • Total Rainfall: <strong>${s.total_rainfall} mm</strong><br>
    • Duration: <strong>${s.days_count} days</strong><br><br>
    💡 ${insight}`;
}

function showSeasonSummary() {
    const seasonal = window.airpulse.seasonal;
    const rows = seasonal.map((s) =>
        `<strong>${s.season}</strong>: PM2.5=${s.avg_pm25}, AQI=${s.avg_aqi}`
    ).join('<br>');
    return `📊 <strong>All Seasons:</strong><br><br>${rows}`;
}
