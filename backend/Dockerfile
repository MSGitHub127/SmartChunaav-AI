FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and the /static folder you moved earlier
COPY . .

# Use the shell form of CMD to ensure $PORT is evaluated
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}