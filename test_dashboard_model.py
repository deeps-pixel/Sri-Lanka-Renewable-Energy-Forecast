import requests
import datetime
import os
import sys

# Ensure we can import from the native scripts folder just like the API does
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from scripts.predict import predict

def test(target_date):
    # Parse the date string to get weekday and month
    try:
        test_date_obj = datetime.datetime.strptime(target_date, "%Y-%m-%d")
    except ValueError:
        print("Invalid date format. Use YYYY-MM-DD")
        return

    print(f"Testing the API & Model for date: {target_date}")
    
    # Call the local dashboard API
    url = f"http://127.0.0.1:8000/api/forecast?date={target_date}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
    except Exception as e:
        print("API is unreachable! Ensure the FastAPI server is running.")
        return
        
    data = resp.json()
    
    print("\n--- HOURLY VALIDATION ---")
    matches = 0
    mismatches = 0
    
    for hr in range(24):
        api_pred = data["forecast"][hr]
        
        w_temp = data["weather"]["temperature"][hr]
        w_hum = data["weather"]["humidity"][hr]
        w_rain = data["weather"]["precipitation"][hr]
        w_wind_ms = data["weather"]["wind"][hr]
        w_solar = data["weather"]["solar"][hr]
        
        # Consistent with API logic (rounding wind)
        model_pred, _, _ = predict(
            temp=w_temp if w_temp is not None else 25.0,
            solar=w_solar if w_solar is not None else 0.0,
            wind=w_wind_ms if w_wind_ms is not None else 0.0,
            rain=w_rain if w_rain is not None else 0.0,
            humidity=w_hum if w_hum is not None else 70.0,
            hour=hr,
            day_of_week=test_date_obj.weekday(),
            month=test_date_obj.month
        )
        
        model_pred_rounded = round(model_pred, 2)
        
        if api_pred == model_pred_rounded:
            matches += 1
        else:
            print(f"Mismatch at {hr:02d}:00 - API: {api_pred}, Model: {model_pred_rounded}")
            mismatches += 1
            
    if mismatches == 0:
        print(f"PASSED: All {matches} hours match exactly.")
    else:
        print(f"FAILED: {mismatches} mismatches found.")

         
if __name__ == "__main__":
    if len(sys.argv) > 1:
        custom_date = sys.argv[1]
    else:
        # Default to tomorrow
        test_date_obj = datetime.datetime.now() + datetime.timedelta(days=1)
        custom_date = test_date_obj.strftime("%Y-%m-%d")
    
    test(custom_date)
