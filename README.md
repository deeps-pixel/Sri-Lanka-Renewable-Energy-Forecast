# Renewable Energy Forecast for Sri Lanka

A probabilistic machine learning system that forecasts renewable energy generation (solar + wind + major hydro) for Sri Lanka's national grid with 80% confidence intervals.

## Background

Sri Lanka's electricity grid operator (CEB) needs to know how much renewable energy will be produced tomorrow. This is difficult because solar, wind, and hydro depend on weather. This project provides a data-driven solution.

## What It Does

| Input | Output |
|-------|--------|
| Weather forecast (temperature, solar radiation, wind, rain, humidity) | Best estimate of renewable generation (MW) |
| Time of day, day of week, month | 80% confidence interval |

## How Accurate Is It?

Tested on 2024 data (not seen during training):

| Metric | Value |
|--------|-------|
| Mean Absolute Error | 223 MW |
| Root Mean Square Error | 280 MW |
| Mean Absolute Percentage Error | 32% |

For a typical renewable output of 700 MW, the error is about 220 MW. This is the reality of weather-dependent forecasting.

## Prediction Intervals

The model provides 80% confidence intervals based on historical error distribution:

- Lower bound: prediction - 231 MW
- Upper bound: prediction + 448 MW

Example: If the model predicts 650 MW, you can be 80% confident actual generation will be between 419 MW and 1,098 MW.

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

- **Live Demo**: This dashboard is ready for deployment on **Hugging Face Spaces** using the provided `Dockerfile`.
- **Sample Data**: A `data/sample_dataset.csv` is included to demonstrate the data schema.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run CLI prediction
python scripts/predict.py --temp 32 --solar 500 --wind 4 --rain 0 --humidity 65

# Start Interactive Dashboard
python -m uvicorn api.main:app --port 8000
```

**Example Output (CLI):**
```
Best estimate: 294 MW
80% confidence interval: 63 - 741 MW
```

## Project Structure

```
sri-lanka-renewable-forecast/
├── notebooks/
│   └── renewable_forecast.ipynb   # Full training pipeline
├── scripts/
│   └── predict.py                  # Command-line prediction
├── models/
│   └── renewable_model.pkl         # Trained LightGBM model
├── data/
│   └── features_dataset.csv        # Feature data
├── reports/
│   └── feature_importance.png      # Feature importance plot
├── requirements.txt
└── README.md
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
