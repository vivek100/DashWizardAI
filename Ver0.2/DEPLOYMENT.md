# 🚀 Deployment Guide

This guide covers deploying the Dashboard Analysis Agent to various platforms.

## 📋 Overview

The application consists of two main components:
- **Backend**: LangGraph agent server (Python)
- **Frontend**: Next.js React application

## 🔧 Environment Variables

### Backend (.env)
```bash
OPENAI_API_KEY=your_openai_api_key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=dashboard-agent
DUCKDB_PATH=./data/dashboard.db
AGENT_MODEL=gpt-4
AGENT_TEMPERATURE=0.1
API_HOST=0.0.0.0
API_PORT=2024
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_LANGGRAPH_API_URL=https://your-backend-domain.com
```

## 🌐 Platform Deployment Options

### 1. Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY agent/ ./agent/
COPY langgraph.json .
COPY start_server.py .

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 2024

# Start the server
CMD ["python", "start_server.py"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY frontend/ .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: 
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "2024:2024"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - API_HOST=0.0.0.0
      - API_PORT=2024
    volumes:
      - ./data:/app/data
    
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_LANGGRAPH_API_URL=http://backend:2024
    depends_on:
      - backend
```

### 2. Railway Deployment

#### Backend (railway.json)
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python start_server.py",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

#### Frontend
Deploy as a standard Next.js application with build command:
```bash
npm run build
```

### 3. Vercel Deployment

#### Frontend Only
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

#### Backend on Railway + Frontend on Vercel
1. Deploy backend to Railway
2. Get Railway backend URL
3. Set `NEXT_PUBLIC_LANGGRAPH_API_URL` in Vercel
4. Deploy frontend to Vercel

### 4. AWS Deployment

#### Using AWS App Runner

**Backend (apprunner.yaml)**
```yaml
version: 1.0
runtime: python3
build:
  commands:
    build:
      - pip install -r requirements.txt
run:
  runtime-version: 3.11
  command: python start_server.py
  network:
    port: 2024
  env:
    - name: API_HOST
      value: "0.0.0.0"
    - name: API_PORT
      value: "2024"
```

**Frontend on AWS Amplify**
1. Connect GitHub repository
2. Set build settings for Next.js
3. Configure environment variables
4. Deploy automatically

### 5. Google Cloud Platform

#### Cloud Run Deployment

**Backend Cloud Run**
```dockerfile
# Use the official Python runtime as the base image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV API_HOST=0.0.0.0
ENV API_PORT=8080

# Expose the port
EXPOSE 8080

# Run the application
CMD ["python", "start_server.py"]
```

**Deploy Commands**
```bash
# Build and deploy backend
gcloud run deploy dashboard-agent-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend to Firebase Hosting
cd frontend
npm run build
firebase deploy
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit API keys to version control
- Use platform-specific secret management
- Rotate keys regularly

### 2. CORS Configuration
```python
# Add to your LangGraph server
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Rate Limiting
Implement rate limiting to prevent abuse:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/dashboard_agent/invoke")
@limiter.limit("10/minute")
async def invoke_agent(request: Request, ...):
    # Your endpoint logic
```

## 📊 Monitoring and Logging

### 1. Health Checks
Add health check endpoints:
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/ready")
async def readiness_check():
    # Check database connectivity, model availability
    return {"status": "ready"}
```

### 2. Logging Configuration
```python
import logging
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)
```

### 3. Error Tracking
Integrate with Sentry or similar:
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
)
```

## 🚀 Performance Optimization

### 1. Database Optimization
- Use connection pooling
- Implement query caching
- Regular database maintenance

### 2. Frontend Optimization
```javascript
// next.config.js
module.exports = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-domain.com'],
  },
  compress: true,
  poweredByHeader: false,
}
```

### 3. Caching Strategy
Implement Redis for caching:
```python
import redis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

# Initialize Redis cache
redis_client = redis.Redis(host='localhost', port=6379, db=0)
FastAPICache.init(RedisBackend(redis_client), prefix="dashboard-agent")
```

## 📈 Scaling Considerations

### 1. Horizontal Scaling
- Use load balancers
- Implement stateless design
- Scale based on CPU/memory metrics

### 2. Database Scaling
- Consider PostgreSQL for production
- Implement read replicas
- Use connection pooling

### 3. Model Serving
- Consider model caching
- Implement request queuing
- Use GPU instances for heavy workloads

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Dashboard Agent

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: python test_integration.py

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        run: railway up

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports 2024/3000 are available
   - Use different ports in production

2. **CORS Errors**
   - Configure proper CORS settings
   - Check frontend API URL configuration

3. **Memory Issues**
   - Monitor memory usage
   - Implement proper garbage collection
   - Use memory-efficient data processing

4. **API Rate Limits**
   - Implement exponential backoff
   - Monitor OpenAI usage
   - Consider using multiple API keys

### Debugging Commands
```bash
# Check logs
docker logs dashboard-agent-backend
docker logs dashboard-agent-frontend

# Monitor resource usage
docker stats

# Test connectivity
curl -X POST http://localhost:2024/health
```

This deployment guide provides comprehensive options for deploying your Dashboard Analysis Agent to various platforms while maintaining security, performance, and scalability. 