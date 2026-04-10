---
title: Sri Lanka Renewable Energy Forecast
emoji: ⚡
colorFrom: blue
colorTo: indigo
sdk: docker
python_version: 3.12
pinned: false
---

# Sri Lanka Renewable Energy Forecast

A probabilistic machine learning system that forecasts renewable energy generation (solar + wind + major hydro) for Sri Lanka's national grid with 80% conformal prediction intervals.

## Live Demo

🔗 [Sri Lanka Energy Forecast Dashboard](https://huggingface.co/spaces/deeps-pixel/sri-lanka-energy-forecast)

## Key Results

| Metric | Value |
|--------|-------|
| **Final MAE (bias corrected)** | **170.3 MW** |
| Improvement over persistence baseline | 39.6% |
| Improvement over raw model | 27.6% |
| Conformal coverage | 82.6% (target 80%) |
| Prediction interval width | ±411 MW |

## Model Performance

| Model | MAE (MW) |
|-------|----------|
| **LightGBM (Quantile)** | **248.8** |
| XGBoost | 248.8 |
| Random Forest | 253.8 |
| Ridge | 260.8 |
| Persistence (baseline) | 281.9 |

## Feature Importance (SHAP)

| Rank | Feature | Importance |
|------|---------|------------|
| 1 | month_sin | 120.1 |
| 2 | hour_cos | 109.0 |
| 3 | month_cos | 50.0 |
| 4 | hour_sin | 49.0 |
| 5 | wind_m_s | 18.6 |
| 6 | dow_sin | 17.5 |
| 7 | precip_mm | 15.7 |
| 8 | humidity_pct | 15.0 |
| 9 | solar_W_m2 | 8.5 |
| 10 | temp_C | 8.4 |

**Key insight:** Time features (hour, month) dominate. Solar radiation is #9, confirming Sri Lanka's grid is hydro-dominated, not solar-dominated.

## Error Analysis & Bias Correction

### Seasonal Bias Detected

| Season | Bias (MW) | Direction |
|--------|-----------|-----------|
| SW Monsoon (May-Sep) | +213.9 | Model under-predicted |
| NE Monsoon (Dec-Feb) | +204.6 | Model under-predicted |
| 1st Inter-Monsoon (Mar-Apr) | +152.8 | Model under-predicted |
| 2nd Inter-Monsoon (Oct-Nov) | -204.5 | Model over-predicted |

**Why:** Heavy rainfall and cloud cover during monsoons reduce solar generation, but the model overestimates renewable output from high wind and rain signals. Bias correction improved MAE by 27.6%.

## Sensitivity Analysis

| Parameter | Effect of ±20% change |
|-----------|----------------------|
| Temperature | Most sensitive (-20% → +263 MW) |
| Humidity | Mildly sensitive |
| Solar, Wind, Rain | Low sensitivity |

## Methodology

### Data Pipeline
- **Source:** 1,500+ CEB generation reports (2021-2024)
- **Weather:** NASA POWER API
- **Resolution:** 15-minute intervals
- **Final dataset:** 140,000+ rows

### Model
- **Algorithm:** LightGBM with quantile regression objective
- **Target:** Renewable = Solar + Wind + Major Hydro
- **Features:** 12 (5 weather + 7 time features with sin/cos encoding)
- **Training:** 2021-2023, Testing: 2024

### Uncertainty Quantification
- **Method:** Conformal prediction
- **Coverage:** 82.6% on held-out test data
- **Interval width:** ±411 MW

## Project Structure

```
sri-lanka-renewable-forecast/
├── api/
│   ├── main.py              # FastAPI Backend
│   └── static/              # Dashboard (HTML/CSS/JS)
├── data/
│   └── features_dataset.csv  # Feature data
├── models/
│   ├── renewable_model_q10.pkl  # Lower Bound
│   ├── renewable_model_q50.pkl  # Best Estimate
│   └── renewable_model_q90.pkl  # Upper Bound
├── notebooks/
│   └── renewable_forecast.ipynb # Full training pipeline
├── reports/
│   └── feature_importance.png   # Analysis plots
├── scripts/
│   └── predict.py           # CLI Tool
├── Dockerfile               # HF Deployment Config
├── requirements.txt         # Dependencies
└── README.md                # Documentation & Meta
```

## Disclaimer

This dashboard forecasts renewable energy generation (solar + wind + major hydro) using weather data from the Colombo region. Actual generation across Sri Lanka may vary due to localized weather patterns. This tool is for academic and portfolio demonstration purposes only and is not intended for operational decision-making.

## Quick Start

### 1. Installation
```bash
# Clone repository
git clone https://github.com/deeps-pixel/Sri-Lanka-Renewable-Energy-Forecast.git
cd Sri-Lanka-Renewable-Energy-Forecast

# Install dependencies
pip install -r requirements.txt
```

### 2. Run CLI Prediction
```bash
python scripts/predict.py --temp 32 --solar 500 --wind 4 --rain 0 --humidity 65
```
# Bias correction is automatically applied (improves MAE by 27.6%)

### 3. Launch Dashboard
```bash
python -m uvicorn api.main:app --port 8000
```
