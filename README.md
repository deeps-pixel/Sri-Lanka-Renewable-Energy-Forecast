# Sri Lanka Renewable Energy Forecast

A probabilistic machine learning system that forecasts renewable energy generation (solar + wind + major hydro) for Sri Lanka's national grid using quantile regression and conformal prediction to provide 80% confidence intervals.

## Live Demo

🔗 [Sri Lanka Energy Forecast Dashboard](https://huggingface.co/spaces/deeps-pixel/sri-lanka-energy-forecast)

---

## Overview

This project builds an end-to-end forecasting system for renewable energy in Sri Lanka. It processes real CEB generation data (2021-2024), engineers weather and time features, trains quantile regression models using LightGBM, and provides calibrated 80% prediction intervals via conformal prediction. The final output is an interactive dashboard that forecasts renewable generation from live weather data.

**What it predicts:** Solar + Wind + Major Hydro (renewable only)

**What it provides:** Best estimate + 80% confidence interval

---

## Key Results

| Metric | Value |
|--------|-------|
| Final MAE (bias corrected) | 170.3 MW |
| Improvement over persistence baseline | 39.6% |
| Improvement over raw quantile model | 27.6% |
| Conformal prediction coverage | 82.6% (target 80%) |
| Prediction interval width | ±411 MW |

---

## Model Performance Comparison

Five models were compared using time series cross-validation (no data leakage):

| Model | CV MAE (MW) |
|-------|--------------|
| **LightGBM (Quantile)** | **248.8** |
| XGBoost | 248.8 |
| Random Forest | 253.8 |
| Ridge | 260.8 |
| Linear Regression | 260.8 |
| Persistence (baseline) | 281.9 |

LightGBM and XGBoost performed equally well. LightGBM was chosen for faster training.

**Why tree-based models win:** Renewable generation has non-linear relationships with weather. Solar panel efficiency drops at high temperatures, wind power scales with the cube of wind speed, and hydro depends on rainfall with time delays. Linear models cannot capture these patterns.

---

## Feature Importance (SHAP Analysis)

| Rank | Feature | Mean SHAP | Interpretation |
|------|---------|-----------|----------------|
| 1 | month_sin | 120.1 | Seasonal cycle (monsoons) |
| 2 | hour_cos | 109.0 | Time of day (cosine component) |
| 3 | month_cos | 50.0 | Seasonal cycle (second component) |
| 4 | hour_sin | 49.0 | Time of day (sine component) |
| 5 | wind_m_s | 18.6 | Wind speed |
| 6 | dow_sin | 17.5 | Day of week |
| 7 | precip_mm | 15.7 | Rainfall (affects hydro) |
| 8 | humidity_pct | 15.0 | Humidity |
| 9 | solar_W_m2 | 8.5 | Solar radiation |
| 10 | temp_C | 8.4 | Temperature |

**Key insight:** Time features (hour, month) dominate over weather features. Solar radiation ranks #9, confirming that Sri Lanka's grid is hydro-dominated, not solar-dominated.

---

## Error Analysis & Bias Correction

### Seasonal Bias Detected

Analysis of prediction errors by season revealed systematic bias:

| Season | Bias (MW) | Direction | Months |
|--------|-----------|-----------|--------|
| SW Monsoon | +213.9 | Model under-predicted | May - September |
| NE Monsoon | +204.6 | Model under-predicted | December - February |
| 1st Inter-Monsoon | +152.8 | Model under-predicted | March - April |
| 2nd Inter-Monsoon | -204.5 | Model over-predicted | October - November |

**Why this happens:** Heavy rainfall and cloud cover during monsoons reduce solar generation, but the model overestimates renewable output from high wind and rain signals. The 2nd Inter-Monsoon is characterized by unpredictable thunderstorms, making it the hardest season to forecast.

**Fix:** Bias correction applied to predictions improved MAE by 27.6% (from 235 MW to 170 MW).

---

## Sensitivity Analysis

How robust is the model to input errors?

| Parameter | Effect of -20% change | Effect of +20% change |
|-----------|----------------------|----------------------|
| Temperature | +263 MW | 0 MW |
| Humidity | +1 MW | +17 MW |
| Solar radiation | 0 MW | +2 MW |
| Wind speed | +2 MW | +3 MW |
| Rainfall | 0 MW | 0 MW |

**Key finding:** Temperature is the most sensitive parameter. Cooler weather increases predicted renewable generation (due to hydro effects from rainfall in catchment areas).

---

## Methodology

### Data Pipeline

| Component | Details |
|-----------|---------|
| **Source** | 1,500+ CEB generation reports (2021-2024) |
| **Weather** | NASA POWER API |
| **Resolution** | 15-minute intervals (energy), up-sampled from hourly (weather) |
| **Final dataset** | 140,253 rows, 15 columns |
| **Missing data** | 0.2% in target (dropped), 2.3% in major hydro (forward-filled), 10-24% in mini hydro/biomass (excluded) |

### Feature Engineering

| Feature Type | Features | Justification |
|--------------|----------|---------------|
| Weather | solar_W_m2, temp_C, wind_m_s, precip_mm, humidity_pct | Direct drivers of renewable generation |
| Time (cyclical) | hour_sin/cos, dow_sin/cos, month_sin/cos | Sin/cos encoding preserves circular nature (23:00 is close to 00:00) |
| Calendar | is_weekend | Weekend demand/generation patterns |

Total features: 12

### Model Training

| Parameter | Value |
|-----------|-------|
| Algorithm | LightGBM with quantile objective |
| Quantiles | 10th, 50th (median), 90th |
| Cross-validation | Time series split (3 folds, 30-day test sets) |
| Training period | 2021-2023 |
| Test period | 2024 |
| Hyperparameters | Default (tuning confirmed they were optimal) |

### Uncertainty Quantification

| Method | Conformal prediction |
|--------|---------------------|
| Calibration | 2023 data |
| Target coverage | 80% |
| Actual coverage | 82.6% (2024 test set) |
| Interval width | ±411 MW (symmetric) |

---

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

## Disclaimer
This dashboard forecasts renewable energy generation (solar + wind + major hydro) using weather data from the Colombo region. Actual generation across Sri Lanka may vary due to localized weather patterns. The model achieves 170 MW MAE with 80% confidence intervals of approximately ±400 MW. This tool is for academic and portfolio demonstration purposes only and is not intended for operational decision-making.

## Acknowledgments

This project would not have been possible without the following organizations and data sources:

- **Ceylon Electricity Board (CEB)** publishing daily generation reports.
- **NASA POWER (Prediction Of Worldwide Energy Resources)** for satellite-derived weather data.
- **Open-Meteo** for free weather forecast APIs.
- **PUCSL** for tariff and loss factor data

*This project was developed for academic and portfolio demonstration purposes.*
