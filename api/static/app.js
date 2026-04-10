// App Logic for Sri Lanka Renewable Energy Forecast Dashboard

document.addEventListener('DOMContentLoaded', () => {
    // Handling Date Restrictions
    const dateInput = document.getElementById('forecast-date');
    const todayObj = new Date();
    
    // YYYY-MM-DD formatter
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const todayStr = formatDate(todayObj);
    
    // Open-Meteo free forecast strictly supports up to 14-16 days ahead cleanly.
    const maxDateObj = new Date();
    maxDateObj.setDate(maxDateObj.getDate() + 14);
    const maxDateStr = formatDate(maxDateObj);

    dateInput.value = todayStr;
    dateInput.min = todayStr; // Block past dates where forecast API might fail without historical flags
    dateInput.max = maxDateStr; // Block distant future beyond reliable forecast threshold

    // Elements
    const fetchBtn = document.getElementById('fetch-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const resultsContainer = document.getElementById('results-container');
    
    // KPI Elements
    const kpiPeak = document.getElementById('kpi-peak-mw');
    const kpiLower = document.getElementById('kpi-lower');
    const kpiUpper = document.getElementById('kpi-upper');
    const kpiSolar = document.getElementById('kpi-solar');
    const kpiTemp = document.getElementById('kpi-temp');
    const kpiRain = document.getElementById('kpi-rain');
    const kpiEnergy = document.getElementById('kpi-energy-gwh');
    const kpiSeason = document.getElementById('kpi-season');

    // Chart.js instances
    let forecastChart = null;
    let weatherChart = null;

    // Defaults for Glass Charts
    Chart.defaults.color = '#c5d4df';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.font.size = 13;

    // Action: ONLY load when user clicks
    fetchBtn.addEventListener('click', () => {
        loadForecast(dateInput.value);
    });

    async function loadForecast(dateStr) {
        // Show loading layer smoothly
        loadingOverlay.classList.remove('hidden');
        resultsContainer.classList.add('hidden-state');
        
        try {
            const res = await fetch(`/api/forecast?date=${dateStr}`);
            if (!res.ok) throw new Error("Failed to fetch forecast");
            
            const data = await res.json();
            
            setTimeout(() => {
                updateDashboard(data);
                loadingOverlay.classList.add('hidden');
                
                // Unhide the dashboard.
                resultsContainer.classList.remove('hidden-state');
            }, 600);

        } catch (err) {
            console.error(err);
            loadingOverlay.classList.add('hidden');
            alert("Error loading forecast: " + err.message);
        }
    }

    function updateDashboard(data) {
        const { forecast, lower, upper, hours, weather } = data;
        
        // 1. Update KPIs for Generation (Find peak hour index)
        const maxMW = Math.max(...forecast);
        const peakIndex = forecast.indexOf(maxMW);
        const peakLower = lower[peakIndex];
        const peakUpper = upper[peakIndex];
        
        const avgSolar = (weather.solar.reduce((a,b)=>a+b, 0) / weather.solar.length).toFixed(0);
        const maxTemp = Math.max(...weather.temperature).toFixed(1);
        const totalRain = weather.precipitation.reduce((a,b)=>a+b, 0).toFixed(1);

        const totalEnergyGWh = (forecast.reduce((a, b) => a + b, 0) / 1000).toFixed(2);

        kpiPeak.innerText = `${maxMW.toFixed(0)} MW`;
        kpiEnergy.innerText = `${totalEnergyGWh} GWh`;
        kpiLower.innerText = `${peakLower.toFixed(0)} MW`;
        kpiUpper.innerText = `${peakUpper.toFixed(0)} MW`;
        kpiSolar.innerText = `${avgSolar} W/m²`;
        kpiTemp.innerText = `${maxTemp} °C`;
        kpiRain.innerText = `${totalRain} mm`;
        kpiSeason.innerText = data.season || "--";

        // 2. Render Forecast Chart
        renderForecastChart(hours, forecast, lower, upper);

        // 3. Render Weather Chart
        renderWeatherChart(hours, weather);
    }

    function renderForecastChart(labels, forecast, lower, upper) {
        const ctx = document.getElementById('forecastChart').getContext('2d');
        if (forecastChart) forecastChart.destroy();

        const gradient = ctx.createLinearGradient(0, 0, 0, 450);
        gradient.addColorStop(0, 'rgba(30, 226, 160, 0.7)');
        gradient.addColorStop(1, 'rgba(10, 20, 35, 0.1)');

        forecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Estimated Generation Capability (MW)',
                        data: forecast,
                        borderColor: '#1ee2a0',
                        backgroundColor: gradient,
                        borderWidth: 4,
                        tension: 0.45,
                        fill: true,
                        pointBackgroundColor: '#1ee2a0',
                        pointBorderColor: '#fff',
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Upper Bound (Quantile 90%)',
                        data: upper,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1.5,
                        borderDash: [8, 4],
                        fill: false,
                        pointRadius: 0
                    },
                    {
                        label: 'Lower Bound (Quantile 10%)',
                        data: lower,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1.5,
                        borderDash: [8, 4],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: getChartOptions('Output (MW)')
        });
    }

    function renderWeatherChart(labels, weather) {
        const ctx = document.getElementById('weatherChart').getContext('2d');
        if (weatherChart) weatherChart.destroy();

        // Update the dynamic heading date
        const dateInput = document.getElementById('forecast-date');
        const trendDateSpan = document.getElementById('trend-date');
        if (dateInput && trendDateSpan) {
            const [y, m, d] = dateInput.value.split('-');
            trendDateSpan.innerText = `${d}/${m}/${y}`;
        }

        // Professional, clean palette for meteorological trends
        const colorRain = '#3b82f6';      // Professional Blue
        const colorTemp = '#e2725b';      // Soft Terracotta
        const colorWind = '#64748b';      // Slate Grey
        const colorSolar = '#b8860b';     // Dark Goldenrod (Muted Gold)

        const gradRain = ctx.createLinearGradient(0, 0, 0, 350);
        gradRain.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
        gradRain.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        const gradTemp = ctx.createLinearGradient(0, 0, 0, 350);
        gradTemp.addColorStop(0, 'rgba(226, 114, 91, 0.2)');
        gradTemp.addColorStop(1, 'rgba(226, 114, 91, 0.0)');

        weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Rainfall (mm)',
                        data: weather.precipitation,
                        borderColor: colorRain,
                        backgroundColor: gradRain,
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y3',
                        hidden: false // Visible by default
                    },
                    {
                        label: 'Temperature (°C)',
                        data: weather.temperature,
                        borderColor: colorTemp,
                        backgroundColor: gradTemp,
                        borderWidth: 2.5,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y',
                        hidden: false // Visible by default
                    },
                    {
                        label: 'Wind Speed (m/s)',
                        data: weather.wind,
                        borderColor: colorWind,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: false,
                        yAxisID: 'y2',
                        hidden: true // Hidden by default
                    },
                    {
                        label: 'Solar Insolation (W/m²)',
                        data: weather.solar,
                        borderColor: colorSolar,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false,
                        yAxisID: 'y1',
                        hidden: true // Hidden by default
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { font: { family: "'Outfit', sans-serif", size: 13 }, boxWidth: 12, padding: 20 } },
                    tooltip: {
                        backgroundColor: 'rgba(10, 15, 25, 0.95)',
                        padding: 14,
                        titleFont: { size: 14, family: "'Outfit', sans-serif" },
                        bodyFont: { size: 13, family: "'Inter', sans-serif" },
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { font: { size: 11 } } },
                    y: {
                        type: 'linear', display: true, position: 'left',
                        title: { display: true, text: 'Temp (°C)', color: colorTemp, font: { weight: '600' } },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: colorTemp }
                    },
                    y1: {
                        type: 'linear', display: false, position: 'right', // Only show when toggled if possible, or keep simple
                        title: { display: true, text: 'Solar (W/m²)', color: colorSolar },
                        grid: { drawOnChartArea: false },
                        ticks: { color: colorSolar }
                    },
                    y2: {
                        type: 'linear', display: false, position: 'right',
                        title: { display: true, text: 'Wind (m/s)', color: colorWind },
                        grid: { drawOnChartArea: false },
                        ticks: { color: colorWind }
                    },
                    y3: {
                        type: 'linear', display: true, position: 'right',
                        title: { display: true, text: 'Rain (mm)', color: colorRain, font: { weight: '600' } },
                        grid: { drawOnChartArea: false },
                        ticks: { color: colorRain }
                    }
                }
            }
        });
    }

    function getChartOptions(yLabel) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { labels: { font: { family: "'Outfit', sans-serif", size: 14 } } },
                tooltip: {
                    backgroundColor: 'rgba(10, 15, 25, 0.9)',
                    padding: 14,
                    titleFont: { size: 15, family: "'Outfit', sans-serif" },
                    bodyFont: { size: 14, family: "'Inter', sans-serif" },
                    borderColor: 'rgba(94, 219, 255, 0.4)',
                    borderWidth: 1
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#c5d4df' } },
                y: {
                    title: { display: true, text: yLabel, color: '#c5d4df', font: { family: "'Outfit', sans-serif", size: 14 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#c5d4df' }
                }
            }
        };
    }
});
