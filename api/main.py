import os
import sys
import requests
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Ensure we can import from scripts
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.predict import predict

app = FastAPI(title="Renewable Forecast API")

# Setup static files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Mount API
@app.get("/api/forecast")
def get_forecast(date: str):
    """
    Fetch weather for Sri Lanka and run prediction for the specified date.
    Date format: YYYY-MM-DD
    """
    try:
        # Validate date
        target_date = datetime.datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    lat = 7.8731
    lon = 80.7718
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,shortwave_radiation&timezone=Asia%2FColombo&start_date={date}&end_date={date}"
    
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather API error: {str(e)}")
        
    hourly = data.get("hourly", {})
    if not hourly:
        raise HTTPException(status_code=500, detail="No hourly data returned from weather API")
        
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    humidity = hourly.get("relative_humidity_2m", [])
    precip = hourly.get("precipitation", [])
    wind_kmh = hourly.get("wind_speed_10m", [])
    solar = hourly.get("shortwave_radiation", [])
    
    forecasts = []
    lowers = []
    uppers = []
    hours_list = []
    
    for i in range(len(times)):
        # Hour
        dt = datetime.datetime.fromisoformat(times[i])
        h = dt.hour
        hours_list.append(f"{h:02d}:00")
        
        # Weather
        t = temps[i]
        hum = humidity[i]
        p = precip[i]
        w_ms = wind_kmh[i] / 3.6 if wind_kmh[i] is not None else 0  # Convert km/h to m/s
        s = solar[i]
        
        # If any is None, put 0
        t = t if t is not None else 25.0
        hum = hum if hum is not None else 70.0
        p = p if p is not None else 0.0
        s = s if s is not None else 0.0
        
        day_of_week = dt.weekday()
        month = dt.month
        
        pred, lower, upper = predict(
            temp=t, solar=s, wind=w_ms, rain=p, humidity=hum,
            hour=h, day_of_week=day_of_week, month=month
        )
        
        forecasts.append(round(pred, 2))
        lowers.append(round(lower, 2))
        uppers.append(round(upper, 2))

    return {
        "date": date,
        "hours": hours_list,
        "forecast": forecasts,
        "lower": lowers,
        "upper": uppers,
        "weather": {
            "temperature": temps,
            "humidity": humidity,
            "precipitation": precip,
            "wind": [round(w/3.6, 2) if w else 0 for w in wind_kmh],
            "solar": solar
        }
    }

app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
