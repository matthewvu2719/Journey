# Use official slim Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# -----------------------------
# 1. Install system dependencies first
# -----------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    pkg-config \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    libavfilter-dev \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------
# 2. Copy only requirements first for caching
# -----------------------------
COPY requirements.txt .

# Upgrade pip & install dependencies
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# -----------------------------
# 3. Copy the rest of the application
# -----------------------------
COPY . .

# -----------------------------
# 4. Expose port & start server
# -----------------------------
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
