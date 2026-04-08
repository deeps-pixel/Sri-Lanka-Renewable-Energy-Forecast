"""
Simple prediction script for renewable forecast.
Usage: python predict.py --temp 32 --solar 500 --wind 4 --rain 0 --humidity 65
"""

import pickle
import numpy as np
import argparse
from pathlib import Path
import sys

# Find the model file automatically
def find_model():
    """Locate the renewable_model.pkl file"""
    search_paths = [
        Path('models/renewable_model.pkl'),
        Path('../models/renewable_model.pkl'),
        Path('renewable_model.pkl'),
        Path('../renewable_model.pkl'),
    ]
    
    for path in search_paths:
        if path.exists():
            return path
    
    # Search recursively
    for path in Path('.').rglob('renewable_model.pkl'):
        return path
    
    return None

# Load model
model_path = find_model()
if model_path is None:
    print("ERROR: Could not find renewable_model.pkl")
    print("Make sure you are in the correct directory")
    sys.exit(1)

print(f"Loading model from: {model_path}")
with open(model_path, 'rb') as f:
    model = pickle.load(f)

# Error bounds from your notebook (replace with actual values from Cell 11)
# These came from your 2024 test set
LOWER_BOUND = -235  # 10th percentile
UPPER_BOUND = 458   # 90th percentile

def predict(temp, solar, wind, rain, humidity, hour=12, day_of_week=2, month=4):
    """Predict renewable generation from weather inputs."""
    
    # Create time features
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)
    dow_sin = np.sin(2 * np.pi * day_of_week / 7)
    dow_cos = np.cos(2 * np.pi * day_of_week / 7)
    month_sin = np.sin(2 * np.pi * month / 12)
    month_cos = np.cos(2 * np.pi * month / 12)
    is_weekend = 1 if day_of_week >= 5 else 0
    
    # Create feature array (12 features in the correct order)
    features = np.array([[
        solar,    # solar_W_m2
        temp,     # temp_C
        wind,     # wind_m_s
        rain,     # precip_mm
        humidity, # humidity_pct
        hour_sin, hour_cos, dow_sin, dow_cos, month_sin, month_cos, is_weekend
    ]])
    
    # Predict
    prediction = model.predict(features)[0]
    lower = prediction + LOWER_BOUND
    upper = prediction + UPPER_BOUND
    
    return prediction, lower, upper

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Predict renewable energy generation')
    parser.add_argument('--temp', type=float, required=True, help='Temperature (°C)')
    parser.add_argument('--solar', type=float, required=True, help='Solar radiation (W/m²)')
    parser.add_argument('--wind', type=float, required=True, help='Wind speed (m/s)')
    parser.add_argument('--rain', type=float, required=True, help='Rainfall (mm)')
    parser.add_argument('--humidity', type=float, required=True, help='Humidity (%)')
    parser.add_argument('--hour', type=int, default=12, help='Hour of day (0-23)')
    parser.add_argument('--day', type=int, default=2, help='Day of week (0=Monday)')
    parser.add_argument('--month', type=int, default=4, help='Month (1-12)')
    
    args = parser.parse_args()
    
    pred, lower, upper = predict(
        args.temp, args.solar, args.wind, args.rain, args.humidity,
        args.hour, args.day, args.month
    )
    
    print("\n" + "=" * 50)
    print("RENEWABLE FORECAST RESULT")
    print("=" * 50)
    print(f"Inputs:")
    print(f"  Temperature: {args.temp}°C")
    print(f"  Solar radiation: {args.solar} W/m²")
    print(f"  Wind speed: {args.wind} m/s")
    print(f"  Rainfall: {args.rain} mm")
    print(f"  Humidity: {args.humidity}%")
    print(f"\nForecast:")
    print(f"  Best estimate: {pred:.0f} MW")
    print(f"  80% confidence interval: {lower:.0f} - {upper:.0f} MW")
    print("=" * 50)