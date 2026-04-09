"""
Quantile Regression Prediction Script
Uses 10th, 50th, and 90th percentile models from LightGBM
"""

import pickle
import numpy as np
import argparse
from pathlib import Path

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

def predict(temp, solar, wind, rain, humidity, hour=12, day_of_week=2, month=4):
    """Predict with 80% confidence interval using quantile models"""
    
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
    
    # Predict using quantile models
    pred_10 = models[10].predict(features)[0]
    pred_50 = models[50].predict(features)[0]
    pred_90 = models[90].predict(features)[0]
    
    return pred_50, pred_10, pred_90

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
    print("RENEWABLE FORECAST (Quantile Regression)")
    print("=" * 50)
    print(f"Best estimate: {median:.0f} MW")
    print(f"80% interval: {lower:.0f} - {upper:.0f} MW")
    print("=" * 50)