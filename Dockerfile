FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for LightGBM
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Port 7860 is the default for Hugging Face Spaces
EXPOSE 7860

# Start the application using uvicorn
# We use api.main:app because the project structure centers around the api folder
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "2"]
