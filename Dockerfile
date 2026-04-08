FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Port 7860 is the default for Hugging Face Spaces
EXPOSE 7860

# Start the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
