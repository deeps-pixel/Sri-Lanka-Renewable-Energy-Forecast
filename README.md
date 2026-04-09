---
title: Sri Lanka Energy Forecast
emoji: ⚡
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---
# Renewable Energy Forecast for Sri Lanka

A probabilistic machine learning system that forecasts renewable energy generation (solar + wind + major hydro) for Sri Lanka's national grid using **LightGBM Quantile Regression** to provide weather-aware 80% confidence intervals.

## Background

Sri Lanka's electricity grid operator (CEB) needs to know how much renewable energy will be produced tomorrow. This is difficult because solar, wind, and hydro depend on weather. This project provides a data-driven solution.

## What It Does

| Input | Output |
|-------|--------|
| Weather forecast (temperature, solar radiation, wind, rain, humidity) | Estimated **Peak Power Projection** (MW) |
| Time of day, day of week, month | Projected **Daily Energy Yield** (GWh) |
| Statistical Uncertainty | Dynamic 80% Confidence Range (Q10 - Q90) |

## How Accurate Is It?

Tested on 2024 data (not seen during training):

| Metric | Value |
|--------|-------|
| Mean Absolute Error | 223 MW |
| Root Mean Square Error | 280 MW |
| Mean Absolute Percentage Error | 32% |

For a typical renewable output of 700 MW, the error is about 220 MW. This is the reality of weather-dependent forecasting.

## Probabilistic Forecasting (Quantile Regression)

Unlike standard regression which predicts a single value, this system uses **Quantile Regression** to account for weather-dependent uncertainty. The backend utilizes three distinct LightGBM models:

- **Q10 Model**: Predicts the 10th percentile (Lower Bound).
- **Q50 Model**: Predicts the 50th percentile (Median / Best Estimate).
- **Q90 Model**: Predicts the 90th percentile (Upper Bound).

This approach allows the confidence interval to expand or contract dynamically based on the specific weather conditions for each hour, rather than relying on a fixed historical offset.

## Model Selection

Five models were compared using time series cross-validation (no data leakage):

| Model | CV MAE (MW) |
|-------|--------------|
| LightGBM | 248.8 |
| XGBoost | 248.8 |
| Random Forest | 253.8 |
| Ridge | 260.8 |
| Linear Regression | 260.8 |

LightGBM and XGBoost performed equally well. LightGBM was chosen for faster training.

## Why Tree-Based Models Win

Renewable generation has non-linear relationships with weather:
- Solar panel efficiency drops at very high temperatures
- Wind power scales with cube of wind speed
- Hydro depends on rainfall with time delays

Linear models cannot capture these patterns. Tree-based models can.

## What Matters Most (Feature Importance)

| Feature | Importance |
|---------|------------|
| Temperature | Highest |
| Rainfall | High |
| Month (seasonal cycle) | High |
| Wind speed | Medium |
| Humidity | Medium |
| Solar radiation | Lower than expected |

Temperature and rainfall being most important confirms that Sri Lanka's renewable generation is dominated by hydro (which depends on rain) and that temperature affects overall energy patterns.

## Data Pipeline

- **Source**: 1,500+ Excel files from CEB (2021-2024)
- **Resolution**: 15-minute intervals
- **Weather data**: NASA POWER API
- **Total rows**: 140,253
- **Features**: 12 (5 weather + 7 time features with sin/cos encoding)

## Interactive Dashboard

An interactive web interface is available for visualizing real-time forecasts and weather trends. It provides a visual representation of the best estimates and 80% confidence intervals.

- **Live Demo**: [Sri Lanka Energy Forecast Dashboard](https://huggingface.co/spaces/deeps-pixel/sri-lanka-energy-forecast)

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run CLI prediction
python scripts/predict.py --temp 32 --solar 500 --wind 4 --rain 0 --humidity 65

# Start Local Dashboard
python -m uvicorn api.main:app --port 8000
```

**Example Output:**
- **Estimated Peak Power Projection**: 1,350 MW
- **Projected Daily Energy Yield**: 18.42 GWh
- **80% Confidence Range (Peak Hour)**: 1,000 – 1,700 MW

## Technical Architecture

### Probabilistic Forecasting (Quantile Regression)
Unlike standard regression which predicts a single value, this system uses **Quantile Regression** to account for weather-dependent uncertainty. The backend utilizes three distinct LightGBM models:
- **Q10 Model**: Predicts the 10th percentile (Safe Minimum).
- **Q50 Model**: Predicts the 50th percentile (Best Estimate).
- **Q90 Model**: Predicts the 90th percentile (Maximum Potential).

This allows the confidence interval to expand or contract dynamically based on specific weather conditions (e.g., higher uncertainty during monsoon periods).

## Project Structure

```
sri-lanka-renewable-forecast/
├── api/
│   ├── main.py              # FastAPI Backend
│   └── static/              # "Liquid Glass" Dashboard (HTML/CSS/JS)
├── models/
│   ├── renewable_model_q10.pkl  # Lower Bound
│   ├── renewable_model_q50.pkl  # Best Estimate
│   └── renewable_model_q90.pkl  # Upper Bound
├── scripts/
│   └── predict.py           # CLI Tool
├── Dockerfile               # HF Deployment Config
├── requirements.txt         # Dependencies
└── README.md                # Documentation & Meta
```

## Requirements

The project relies on the following key dependencies (see `requirements.txt`):
```text
pandas>=2.0.0
numpy>=1.24.0
lightgbm>=4.0.0
scikit-learn>=1.3.0
matplotlib>=3.7.0
xgboost>=1.7.0
```
