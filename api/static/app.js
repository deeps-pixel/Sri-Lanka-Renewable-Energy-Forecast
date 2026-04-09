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

        kpiPeak.innerText = `${maxMW.toFixed(0)} MW`;
        kpiLower.innerText = `${peakLower.toFixed(0)} MW`;
        kpiUpper.innerText = `${peakUpper.toFixed(0)} MW`;
        kpiSolar.innerText = `${avgSolar} W/m²`;
        kpiTemp.innerText = `${maxTemp} °C`;
        kpiRain.innerText = `${totalRain} mm`;

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

        // Liquid glass backdrop gradients for the weather chart
        const gradTemp = ctx.createLinearGradient(0, 0, 0, 350);
        gradTemp.addColorStop(0, 'rgba(239, 71, 111, 0.4)');
        gradTemp.addColorStop(1, 'rgba(239, 71, 111, 0.0)');

        const gradSolar = ctx.createLinearGradient(0, 0, 0, 350);
        gradSolar.addColorStop(0, 'rgba(255, 209, 102, 0.4)');
        gradSolar.addColorStop(1, 'rgba(255, 209, 102, 0.0)');
        
        const gradWind = ctx.createLinearGradient(0, 0, 0, 350);
        gradWind.addColorStop(0, 'rgba(76, 201, 240, 0.3)');
        gradWind.addColorStop(1, 'rgba(76, 201, 240, 0.0)');

        weatherChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: weather.temperature,
                        borderColor: '#ef476f',
                        backgroundColor: gradTemp,
                        borderWidth: 3,
                        tension: 0.6,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Solar Insolation (W/m²)',
                        data: weather.solar,
                        borderColor: '#ffd166',
                        backgroundColor: gradSolar,
                        borderWidth: 3,
                        tension: 0.6,
                        fill: true,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Wind Speed (m/s)',
                        data: weather.wind,
                        borderColor: '#4cc9f0',
                        backgroundColor: gradWind,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.6,
                        fill: true,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { labels: { font: { family: "'Outfit', sans-serif", size: 14 } } },
                    tooltip: {
                        backgroundColor: 'rgba(10, 15, 25, 0.9)',
                        padding: 14,
                        titleFont: { size: 15, family: "'Outfit', sans-serif" },
                        bodyFont: { size: 14, family: "'Inter', sans-serif" }
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: {
                        type: 'linear', display: true, position: 'left',
                        title: { display: true, text: 'Temp (°C)', color: '#ef476f' },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#ef476f' }
                    },
                    y1: {
                        type: 'linear', display: true, position: 'right',
                        title: { display: true, text: 'Solar (W/m²)', color: '#ffd166' },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#ffd166' }
                    },
                    y2: {
                        type: 'linear', display: true, position: 'right', // Displaying the wind axis
                        title: { display: true, text: 'Wind (m/s)', color: '#4cc9f0' },
                        grid: { drawOnChartArea: false },
                        // Offset by layout to prevent overlap with y1 if possible
                        ticks: { color: '#4cc9f0' }
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
