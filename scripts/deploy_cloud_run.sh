#!/usr/bin/env bash
set -euo pipefail

# Quick deploy to Google Cloud Run using Cloud Build.
# Reads optional config from .env and allows overriding via env vars.
# Defaults align with cloudbuild.yaml substitutions.

: "${PROJECT_ID:=malafaareh-481713}"
: "${REGION:=europe-west1}"
: "${RUN_REGION:=${REGION}}"
: "${REPO:=luxe-repo}"
: "${SERVICE_NAME:=luxe-modern-ecommerce-api}"
: "${IMAGE_TAG:=latest}"

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE_NAME}:${IMAGE_TAG}"

echo "[deploy] Project=${PROJECT_ID} Region=${RUN_REGION} Service=${SERVICE_NAME} Image=${IMAGE}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install from https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

echo "[deploy] Configuring gcloud..."
gcloud config set project "${PROJECT_ID}" >/dev/null
gcloud config set run/platform managed >/dev/null
gcloud config set run/region "${RUN_REGION}" >/dev/null

# Optionally source .env to pick up runtime vars
if [[ -f .env ]]; then
  echo "[deploy] Loading .env for runtime vars"
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Ensure Artifact Registry repo exists
echo "[deploy] Ensuring Artifact Registry repo '${REPO}' exists in ${REGION}..."
if ! gcloud artifacts repositories describe "${REPO}" --location="${REGION}" >/dev/null 2>&1; then
  gcloud artifacts repositories create "${REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Container images for ${SERVICE_NAME}" || true
fi

echo "[deploy] Building and pushing image via Cloud Build..."
gcloud builds submit --tag "${IMAGE}" --quiet

# Build --set-env-vars list based on available variables
ENV_FLAGS=("NODE_ENV=production" "PORT=${PORT:-8080}")
append_env() {
  local name="$1"; local val="${!1:-}"
  if [[ -n "$val" ]]; then ENV_FLAGS+=("${name}=${val}"); fi
}

append_env JWT_SECRET
append_env ADMIN_EMAIL
append_env ADMIN_PASSWORD
append_env COOKIE_DOMAIN
append_env ALLOWED_ORIGINS
append_env FRONTEND_ORIGIN
append_env DATABASE_URL
append_env PGHOST
append_env PGUSER
append_env PGPASSWORD
append_env PGDATABASE
append_env PGPORT
append_env DB_IAM_AUTH
append_env INSTANCE_CONNECTION_NAME
append_env STRIPE_SECRET_KEY
append_env STRIPE_WEBHOOK_SECRET
append_env STRIPE_CURRENCY

ENV_ARG="--set-env-vars=$(IFS=','; echo "${ENV_FLAGS[*]}")"

echo "[deploy] Deploying Cloud Run service '${SERVICE_NAME}'..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${RUN_REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 512Mi \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 5 \
  ${ENV_ARG} \
  --quiet

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${RUN_REGION}" --format 'value(status.url)')
echo "[deploy] Service URL: ${SERVICE_URL}"
echo "[deploy] Done. Try: curl -sSf '${SERVICE_URL}/health' && open '${SERVICE_URL}'"
