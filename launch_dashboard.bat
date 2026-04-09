@echo off
SETLOCAL EnableDelayedExpansion

TITLE Sri Lanka Renewable Forecast Launcher

echo ========================================================
echo   SRI LANKA RENEWABLE ENERGY FORECAST DASHBOARD
echo ========================================================
echo.

:: Check for python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found in PATH. Please install Python.
    pause
    exit /b 1
)

echo [1/2] Launching browser to http://127.0.0.1:8000...
start "" "http://127.0.0.1:8000"

echo [2/2] Starting Backend API Server...
echo.
echo Press Ctrl+C to stop the server.
echo.

python -m uvicorn api.main:app --port 8000 --log-level info

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server failed to start. 
    echo Did you install the requirements? Run 'pip install -r requirements.txt'
    pause
)

ENDLOCAL
