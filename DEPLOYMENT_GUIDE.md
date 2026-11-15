# AuraCare Google Cloud Run Deployment Guide

This guide outlines the complete steps to deploy **AuraCare (Smart Elderly Care & Medication Management Platform)** directly to **Google Cloud Run** to obtain the live public URL required for hackathon submission.

---

## Architecture Overview

- **Runtime:** Node.js 22 LTS containerized via multi-stage Dockerfile
- **Container Port:** `8080` (Standard for Google Cloud Run)
- **Frontend:** Pre-compiled Vite single-page application served directly by Express static handler
- **Backend:** Express REST API with native SQLite / PostgreSQL storage support
- **Health Probe:** `/api/health`

---

## Method 1: Direct Cloud Run Deployment (Recommended - 1 Command)

With the Google Cloud SDK (`gcloud`) installed on your workstation or Cloud Shell:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login

# 2. Select or create your Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# 3. Deploy directly from current source directory
gcloud run deploy auracare \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars NODE_ENV=production,PORT=8080
```

Cloud Run will automatically execute Cloud Build, package the container from `Dockerfile`, deploy the service, and print your **live public HTTPS URL**:
```
Service URL: https://auracare-xxxx-uc.a.run.app
```

---

## Method 2: Docker Container Build & Push

If you prefer building and pushing container images manually:

```bash
# 1. Build local container image
docker build -t gcr.io/YOUR_PROJECT_ID/auracare:latest .

# 2. Authenticate Docker with Google Container Registry / Artifact Registry
gcloud auth configure-docker

# 3. Push container image
docker push gcr.io/YOUR_PROJECT_ID/auracare:latest

# 4. Deploy container image to Cloud Run
gcloud run deploy auracare \
  --image gcr.io/YOUR_PROJECT_ID/auracare:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

---

## Method 3: Automated Google Cloud Build Pipeline

Submit the included `cloudbuild.yaml` file:

```bash
gcloud builds submit --config cloudbuild.yaml .
```

---

## Environment Variables Configuration

Set these variables in the Cloud Run service configuration or via `--set-env-vars`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Listening port for Cloud Run | `8080` |
| `NODE_ENV` | Environment mode | `production` |
| `JWT_SECRET` | Secret key for signing authentication tokens | (auto-configured) |
| `GEMINI_API_KEY` | Optional Google Gemini 1.5 Flash API Key | `AIzaSy...` |
| `SMTP_HOST` | Optional SMTP host for real email delivery | `smtp.gmail.com` |
| `SMTP_USER` | SMTP username | `alerts@auracare.health` |
| `SMTP_PASS` | SMTP application password | `••••••••` |

> *Note: If SMTP credentials are not supplied, AuraCare runs in Smart Simulation Mode where proactive emails are formatted as full responsive HTML, logged in the database, and previewable in real time.*

---

## Post-Deployment Verification Checklist

1. Navigate to `https://auracare-xxxx-uc.a.run.app/api/health` and verify `{"status": "healthy"}`.
2. Open the root URL in your browser: `https://auracare-xxxx-uc.a.run.app/`
3. Test Senior Mode by clicking **PIN Access** and entering demo passcode `1234`.
4. Test Caregiver Portal using `sarah.vance@auracare.health` / `care123`.
5. Test Admin Portal using `admin@auracare.health` / `admin123`.
