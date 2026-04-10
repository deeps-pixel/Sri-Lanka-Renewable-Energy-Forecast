"""
Quantile Regression Prediction Script with Bias Correction
Uses 50th percentile model from LightGBM with conformance prediction intervals
"""

import pickle
import numpy as np
import argparse
from pathlib import Path

# Seasonal bias values (Actual - Predicted) in MW
# Based on historical analysis in renewable_forecast.ipynb
SEASONAL_BIAS = {
    "1st Inter-Monsoon (Mar-Apr)": 152.75,
    "2nd Inter-Monsoon (Oct-Nov)": -204.53,
    "NE Monsoon (Dec-Feb)": 204.58,
    "SW Monsoon (May-Sep)": 213.91
}

# Conformance prediction threshold for 80% confidence interval
CONFORMANCE_THRESHOLD = 392

# Load all three quantile models
models = {}

for q, filename in [(10, 'renewable_model_q10.pkl'), 
                    (50, 'renewable_model_q50.pkl'),
                    (90, 'renewable_model_q90.pkl')]:
    path = Path(f'models/{filename}')
    if path.exists():
        with open(path, 'rb') as f:
            models[q] = pickle.load(f)
        print(f"Loaded {filename}")
    else:
        print(f"Warning: {filename} not found")

def get_season_name(month):
    """Determine the monsoon season based on the month (1-12)"""
    if month in [3, 4]:
        return "1st Inter-Monsoon (Mar-Apr)"
    elif month in [10, 11]:
        return "2nd Inter-Monsoon (Oct-Nov)"
    elif month in [12, 1, 2]:
        return "NE Monsoon (Dec-Feb)"
    else:  # 5, 6, 7, 8, 9
        return "SW Monsoon (May-Sep)"

def predict(temp, solar, wind, rain, humidity, hour=12, day_of_week=2, month=4):
    """Predict with 80% confidence interval using seasonal bias correction and conformal prediction"""
    
    # Time features
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    dow_sin = np.sin(2 * np.pi * day_of_week / 7)
    dow_cos = np.cos(2 * np.pi * day_of_week / 7)
    month_sin = np.sin(2 * np.pi * month / 12)
    month_cos = np.cos(2 * np.pi * month / 12)
    is_weekend = 1 if day_of_week >= 5 else 0
    
    features = np.array([[
        solar, temp, wind, rain, humidity,
        hour_sin, hour_cos, dow_sin, dow_cos, month_sin, month_cos, is_weekend
    ]])
    
    # Base median prediction from 50th percentile model
    pred_50 = models[50].predict(features)[0]
    
    # Apply seasonal bias correction
    season = get_season_name(month)
    bias = SEASONAL_BIAS.get(season, 0.0)
    corrected_median = pred_50 + bias
    
    # Apply symmetric conformance threshold for 80% confidence interval
    lower = corrected_median - CONFORMANCE_THRESHOLD
    upper = corrected_median + CONFORMANCE_THRESHOLD
    
    # Clip lower bound to 0 MW for physical realism
    lower = max(0, lower)
    
    return corrected_median, lower, upper

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--temp', type=float, required=True)
    parser.add_argument('--solar', type=float, required=True)
    parser.add_argument('--wind', type=float, required=True)
    parser.add_argument('--rain', type=float, required=True)
    parser.add_argument('--humidity', type=float, required=True)
    args = parser.parse_args()
    
    median, lower, upper = predict(args.temp, args.solar, args.wind, args.rain, args.humidity)
    
    print("\n" + "=" * 50)
    print("RENEWABLE FORECAST (Conformance Prediction)")
    print("=" * 50)
    print(f"Best estimate: {median:.0f} MW")
    print(f"80% interval: {lower:.0f} - {upper:.0f} MW")
    print("=" * 50)