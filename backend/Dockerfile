FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install both root RAG deps and Django deps
COPY requirements.txt /app/requirements.txt
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt -r /app/backend/requirements.txt

COPY . .

ENV PYTHONPATH=/app

CMD ["python", "backend/manage.py", "runserver", "0.0.0.0:8000"]
