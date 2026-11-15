#!/usr/bin/env bash
# AuraCare Google Cloud Run Deployment Script

set -e

SERVICE_NAME="auracare"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null || echo '')}"

echo "=========================================================="
echo "🚀 Deploying AuraCare to Google Cloud Run"
echo "=========================================================="

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No Google Cloud Project ID detected."
  echo "Please run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project ID:   $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region:       $REGION"
echo "Port:         8080"
echo "Ingress:      All (Public Internet Traffic Allowed)"
echo "Auth Policy:  Allow unauthenticated access (--allow-unauthenticated)"
echo ""

# Enable required Google Cloud services
echo "1. Enabling required Google Cloud APIs (Cloud Run & Cloud Build)..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project "$PROJECT_ID"

# Build and Deploy to Cloud Run
echo "2. Building and deploying container to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars NODE_ENV=production,PORT=8080

# Retrieve and display public service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format 'value(status.url)')

echo ""
echo "=========================================================="
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "Public Website URL: $SERVICE_URL"
echo "Health Check:       $SERVICE_URL/api/health"
echo "=========================================================="

