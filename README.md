<div align="center">

# 🌬️ AirPulse Rourkela: Air Quality Analytics & ML Dashboard

[![Live Dashboard](https://img.shields.io/badge/🌐_Live_Dashboard-Open_Now-2ea44f?style=for-the-badge)](http://127.0.0.1:5500/airpulse_rourkela/index.html)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Power BI](https://img.shields.io/badge/Power_BI-Dashboard-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)](https://powerbi.microsoft.com)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Deployed-222222?style=for-the-badge&logo=github)](https://avijeet2463.github.io/airpulse-rourkela-dashboard/index.html)

**An end-to-end data analytics and machine learning project investigating air quality patterns in Rourkela, India.**  
Built with Python · SQLite · Power BI · Chart.js · Client-Side Linear Regression

</div>

---

## 🔗 Quick Links

| Resource | Link |
|---|---|
| 🌐 Live Web Dashboard | [Open Dashboard](http://127.0.0.1:5500/airpulse_rourkela/index.html) |
| 📁 GitHub Repository | [avijeet2463/airpulse-rourkela-dashboard](https://github.com/avijeet2463/airpulse-rourkela-dashboard) |

---

## 📌 Problem Statement

Rourkela, Odisha is one of India's major industrial steel hubs. The combination of heavy steel smelting, vehicular emissions, dust, and localized weather patterns creates significant seasonal air pollution challenges. This project answers:

> **"How do temperature, wind, and precipitation dynamically influence PM2.5 levels across seasons in Rourkela, and can we predict AQI in real-time?"**

By merging air quality metrics with meteorological data and Google Trends search interest over 365 days, I built a relational SQL warehouse, performed exploratory data analysis, designed a Power BI dashboard, and implemented a live interactive web dashboard featuring a **90.4% accurate client-side Machine Learning model** and an **offline AI Chat Agent**.

---

## 🖥️ Power BI Dashboard Preview

| 📊 Overview Page | 🌦️ Weather Impact | 🍂 Seasonal Analysis |
|:---:|:---:|:---:|
| ![Overview](outputs/plots/overview.png) | ![Weather Impact](outputs/plots/Weather%20Imapact.png) | ![Seasonal Analysis](outputs/plots/Seasonal%20Analysis.png) |

> 👆 **3 interactive pages** — Overview · Weather Impact · Seasonal Analysis 


---

## 🏗️ Project Architecture

```
Raw CSV Datasets (Air Quality, Weather, Trends)
                     ↓
         Phase 1: Database Loading
           - SQLite3 Schema Setup
           - SQL View Merging (v_merged_data)
                     ↓
         Phase 2: Data Quality & SQL Stats
           - NULL/Duplicate validations
           - Seasonal & Pearson correlation queries
                     ↓
         Phase 3: Python EDA & Visualization
           - Matplotlib/Seaborn plot generation
                     ↓
    ┌────────────────┴────────────────┐
    ↓                                 ↓
Phase 4: Power BI Report          Phase 5: Web Dashboard
  - .pbix interactive dashboard     - Responsive Top-Nav UI
  - DAX Measures & Slicers          - Real-Time Chart.js
                                    - Live ML Regression
                                    - Rule-Based AI Chatbot
```

---

## 📂 Repository Structure

```
airpulse_rourkela/
│
├── 📁 data/
│   ├── airpulse_rourkela.db           # Relational SQLite database
│   └── 📁 csv/                        # Cleaned CSV datasets
│       ├── air_quality.csv            # Daily PM2.5, PM10, SO2, NO2, AQI
│       ├── weather.csv                # Daily Temp, Humidity, Wind, Precip
│       └── daily_dashboard.csv        # Consolidated master table
│
├── 📁 sql/                            # 8 Structured query files
│   ├── 01_create_tables.sql           # Schema definition + merged views
│   ├── 02_data_quality_checks.sql     # Range checks, null counts
│   ├── 04_correlation_analysis.sql    # Pearson r calculations
│   └── 08_powerbi_views.sql           # Optimized views for Power BI
│
├── 📁 scripts/                        # 4 Python pipeline automation scripts
│   ├── generate_dataset.py            # Physics-based data generation
│   ├── load_to_sqlite.py              # SQLite importer
│   └── eda_analysis.py                # Python visualization engine
│
├── 📁 outputs/plots/                  # 6 Saved publication-quality figures
│   ├── pm25_timeseries.png
│   ├── correlation_heatmap.png
│   └── weather_vs_pollution.png
│
├── 📁 powerbi/
│   └── AirPulse_Rourkela_Dashboard.pbix # Interactive Power BI workbook
│
├── index.html                         # Premium Dark-Theme Web Dashboard: 4-page UI structure (top navigation)
├── styles.css                         # Glassmorphic responsive styling
├── app.js                             # Global state, PapaParse CSV loader, KPIs
├── charts.js                          # Dynamic Chart.js animations
├── prediction.js                      # In-browser Multiple Linear Regression
├── agent.js                           # Rule-based offline AI chat assistant
├── requirements.txt                   # Python dependencies
└── README.md
```

---

## 🔍 Key Findings from SQL & EDA

| Metric / Variable | Finding | Business / Health Insight |
|---|---|---|
| ❄️ **Winter Season** | Highest average AQI of **283.0** (Poor/Very Poor) | Temperature inversion traps heavy metals and PM2.5 near the ground. |
| 🌧️ **Monsoon Season** | Cleanest air with average AQI of **28.0** (Good) | Heavy rains physically wash out particulate matter via wet deposition. |
| 💨 **Wind Speed** | Inverse correlation with PM2.5 (**r = -0.385**) | Calm winds fail to disperse steel plant exhaust, leading to rapid pollution buildup. |
| 🌧️ **Precipitation** | PM2.5 drops by **76%** on rainy days | Rain serves as a natural scrubbing agent; avg PM2.5 drops from 74.5 to 17.8 μg/m³. |
| 📈 **Google Trends** | Search interest peaks (**100**) on worst days | Awareness is reactive; public searches for health tips only *after* AQI spikes. |

---

## 🔮 In-Browser Machine Learning (ML)

Instead of relying on cloud APIs or Python servers, the dashboard features a **Multiple Linear Regression (MLR)** model implemented in pure JavaScript using the **Normal Equation**:

$$\beta = (X^T X)^{-1} X^T y$$

This model trains instantly on the 365-day dataset when the page loads, achieving an **$R^2$ Score of 90.4%**.

### Model Coefficients (PM2.5 Predictors)

$$\text{Predicted PM2.5} = 179.83 - 3.37(T) + 0.48(H) - 2.80(W) - 0.12(P) - 43.96(S) - 48.30(M) - 8.18(PM)$$

*Where $T$ = Temp (°C), $H$ = Humidity (%), $W$ = Wind Speed (km/h), $P$ = Rain (mm), $S$ = Summer, $M$ = Monsoon, $PM$ = Post-Monsoon (Winter is baseline).*

### Sensitivity Analysis & What-If Scenarios
The dashboard includes:
- **Comparison Chart**: Graphs the live prediction against historical seasonal averages.
- **Sensitivity Line Chart**: Dynamically shows how the predicted PM2.5 value changes as you sweep each weather variable while holding others constant.

---

## 🤖 Rule-Based AI Chat Assistant
Available on all 4 pages as a floating panel, the **AirPulse Assistant** is an offline natural language query engine that translates user questions into data lookups. It handles 30+ question categories:
- **Statistical Queries**: *"What was the worst day/month?"*, *"Show average stats"*
- **Environmental Concepts**: *"Explain AQI"*, *"What is PM2.5?"*
- **Correlations**: *"How does wind dispersion work?"*, *"Does rain help?"*
- **Actionable Health Tips**: *"Suggest mask options"*, *"Can I go for a run in winter?"*

---

## 🛠️ Tech Stack

| Category | Tools |
|---|---|
| **Programming Languages** | Python 3.13, SQL, Vanilla JavaScript (ES6) |
| **Relational Database** | SQLite 3 |
| **Libraries (Python)** | pandas, numpy, scikit-learn, Matplotlib, seaborn |
| **Frontend Styling** | HTML5, CSS3 (Glassmorphism, custom dark variables) |
| **Visualization** | Chart.js 4.4, Power BI Desktop |
| **Parsing & ML** | PapaParse (CSV streaming), Matrix Normal Equation (JS) |
| **Deployment** | GitHub Pages, Python http.server |

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.13+
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/avijeet2463/airpulse-rourkela-dashboard.git
cd airpulse-rourkela-dashboard

# 2. Install dependencies
pip install -r requirements.txt

# 3. Re-run the data pipeline (Optional)
python scripts/generate_dataset.py
python scripts/load_to_sqlite.py
python scripts/eda_analysis.py
python scripts/export_for_powerbi.py

# 4. Spin up the server from project root to avoid CORS blocks
python -m http.server 8080

# 5. Open the dashboard in your browser
# 👉 http://localhost:8080/index.html
```

---

## 💡 Business & Public Health Recommendations

Based on the statistical analysis, three core strategies emerge:

**1. Implement Active Warning Triggers in Late Autumn (Oct-Nov)**
> Preventative campaigns should deploy when temperatures drop below 20°C. Offering warnings before the winter inversion prevents crop residue burning and RSP exhaust from accumulating.

**2. Focus Industrial Operations during High Dispersion Windows**
> RSP (Rourkela Steel Plant) heavy smelting schedules should align with wind speeds >6 km/h. Running furnaces at peak capacity during calm winter mornings dramatically increases localized health risks.

**3. Target High-Traffic Public Spaces with Wet Scrubbing**
> Since precipitation drops PM2.5 by 76%, artificial misting cannons should be targeted in high-AQI hotspots (e.g., Bisra Road) during calm dry spells to replicate rain washout.

---

## ✍️ Author

**Avijeet Mohapatra**  
Final-year CSE student focused on data analytics, relational engineering, and client-side web application deployment. I design pipelines that transform messy database schemas into interactive dashboards for recruiters and stakeholders.

**What I bring:**
- 🔍 **Data Storytelling**: Extracting actionable business insights using SQL and Python.
- 🤖 **Relational Engineering**: Creating structured, lightweight SQLite warehouses.
- 📊 **BI & Web Visualization**: Designing dashboards in both Power BI and modern glassmorphic web apps.
- 🚀 **End-to-End Execution**: Moving from data generation scripts to a hosted GitHub Pages URL.

**Currently Seeking**: Fresher Data Analyst roles.

<div align="center">

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Avijeet_Mohapatra-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/avijeet-mohapatra-a4573a254/)
[![GitHub](https://img.shields.io/badge/GitHub-avijeet2463-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/avijeet2463)
[![Portfolio](https://img.shields.io/badge/Live_Dashboard-Visit-2ea44f?style=for-the-badge)](http://127.0.0.1:5500/airpulse_rourkela/index.html)

</div>

---

<div align="center">

*⭐ Star this repo if you found this portfolio project useful!*

</div>
