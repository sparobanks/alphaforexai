FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc g++ libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p models/saved logs

EXPOSE 8000

CMD ["uvicorn", "app.api.main_full:app", "--host", "0.0.0.0", "--port", "8000"]
