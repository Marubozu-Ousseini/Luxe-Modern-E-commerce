#!/usr/bin/env bash
set -euo pipefail

# Production deploy (API + Web + Firebase Hosting)
# Usage:
#   ./scripts/deploy-production.sh [PROJECT_ID]
# Env overrides:
#   REGION, RUN_REGION, REPO, API_SERVICE_NAME, WEB_SERVICE_NAME, IMAGE_TAG
#   RUN_TESTS (true/false)

PROJECT_ID="${1:-${PROJECT_ID:-malafaareh-481713}}"
: "${REGION:=europe-west1}"
: "${RUN_REGION:=${REGION}}"
: "${REPO:=luxe-repo}"
: "${API_SERVICE_NAME:=luxe-modern-ecommerce-api}"
: "${WEB_SERVICE_NAME:=luxe-modern-ecommerce-web}"
: "${IMAGE_TAG:=latest}"
: "${RUN_TESTS:=true}"
: "${RUN_DB_MIGRATIONS:=false}"
: "${RUN_DB_SYNC_PRODUCTS:=false}"

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install from https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

echo "[deploy] Project=${PROJECT_ID} Region=${RUN_REGION} Repo=${REPO} Tag=${IMAGE_TAG}"

if [[ "${RUN_DB_MIGRATIONS}" == "true" ]]; then
  echo "[deploy] Running DB migrations..."
  npm run migrate
fi

if [[ "${RUN_DB_SYNC_PRODUCTS}" == "true" ]]; then
  echo "[deploy] Syncing backend products into DB..."
  npm run sync:products
fi

API_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${API_SERVICE_NAME}:${IMAGE_TAG}"
WEB_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${WEB_SERVICE_NAME}:${IMAGE_TAG}"

echo "[deploy] Deploying API via Cloud Build (${API_SERVICE_NAME})..."
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config cloudbuild.yaml \
  --substitutions _PROJECT_ID="${PROJECT_ID}",_REGION="${REGION}",_RUN_REGION="${RUN_REGION}",_REPO="${REPO}",_SERVICE_NAME="${API_SERVICE_NAME}",_IMAGE_TAG="${IMAGE_TAG}",_RUN_TESTS="${RUN_TESTS}",_DEPLOY_CLOUD_RUN="false" \
  --quiet

echo "[deploy] Deploying API to Cloud Run (local gcloud)..."
gcloud run deploy "${API_SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --image "${API_IMAGE}" \
  --region "${RUN_REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --service-account="cloud-run-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
  --concurrency=80 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars=NODE_ENV=production \
  --quiet

echo "[deploy] Deploying Web via Cloud Build (${WEB_SERVICE_NAME})..."
gcloud builds submit \
  --project "${PROJECT_ID}" \
  --config cloudbuild.web.yaml \
  --substitutions _PROJECT_ID="${PROJECT_ID}",_REGION="${REGION}",_RUN_REGION="${RUN_REGION}",_REPO="${REPO}",_SERVICE_NAME="${WEB_SERVICE_NAME}",_IMAGE_TAG="${IMAGE_TAG}",_DEPLOY_CLOUD_RUN="false" \
  --quiet

echo "[deploy] Deploying Web to Cloud Run (local gcloud)..."
gcloud run deploy "${WEB_SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --image "${WEB_IMAGE}" \
  --region "${RUN_REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --concurrency=80 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars=NODE_ENV=production \
  --quiet

echo "[deploy] Deploying Firebase Hosting + Functions..."
npx firebase deploy --only hosting,functions

echo "[deploy] Done."