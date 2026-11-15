# AuraCare Google Cloud Run Deployment Script (PowerShell)
[CmdletBinding()]
param (
    [string]$ProjectId = $env:GOOGLE_CLOUD_PROJECT,
    [string]$Region = "us-central1",
    [string]$ServiceName = "auracare"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying AuraCare to Google Cloud Run" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "Google Cloud SDK (gcloud CLI) is not installed on this machine." -ForegroundColor Yellow
    Write-Host "Alternative Instant Deployment Options:" -ForegroundColor Cyan
    Write-Host "1. One-Click Cloud Run Button: https://deploy.cloud.run/?git_repo=https://github.com/nagvadiyabrij/promntwar.git"
    Write-Host "2. Google Cloud Shell (in browser): Run ./deploy-cloud-run.sh"
    exit 1
}

if (-not $ProjectId) {
    $ProjectId = (gcloud config get-value project 2>$null).Trim()
}

if (-not $ProjectId) {
    Write-Host "Error: No Google Cloud Project ID found. Please run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
    exit 1
}

Write-Host "Project ID:   $ProjectId"
Write-Host "Service Name: $ServiceName"
Write-Host "Region:       $Region"
Write-Host "Port:         8080"
Write-Host "Ingress:      All (Public Internet Traffic Allowed)"
Write-Host "Auth Policy:  Unauthenticated Access Allowed (--allow-unauthenticated)"
Write-Host ""

Write-Host "1. Enabling Cloud Run & Cloud Build APIs..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project $ProjectId

Write-Host "2. Building & Deploying service to Google Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $ServiceName `
    --source . `
    --project $ProjectId `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --cpu 1 `
    --set-env-vars NODE_ENV=production,PORT=8080

$serviceUrl = (gcloud run services describe $ServiceName --project $ProjectId --region $Region --format "value(status.url)").Trim()

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "Public Website URL: $serviceUrl" -ForegroundColor Cyan
Write-Host "Health Check:       $serviceUrl/api/health" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
