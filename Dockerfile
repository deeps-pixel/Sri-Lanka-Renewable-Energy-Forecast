# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
# PYTHONUNBUFFERED=1 ensures that python logs are sent straight to terminal (container logs) 
# without being first buffered and that you can see the output of your application in real time.
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
# We use .dockerignore or ensure we don't copy unnecessary files manually
COPY . .

# Hugging Face Spaces with Docker SDK expect the application to run on port 7860
EXPOSE 7860

# Run the app 
# host 0.0.0.0 is necessary for the container to be reachable from the outside
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]
