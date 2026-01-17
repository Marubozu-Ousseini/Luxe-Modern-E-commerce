#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:=malafaareh-481713}"
: "${RUN_REGION:=europe-west1}"
: "${SERVICE_NAME:=luxe-modern-ecommerce-web}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install from https://cloud.google.com/sdk/docs/install" >&2
  exit 1
fi

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --project "${PROJECT_ID}" --region "${RUN_REGION}" --format 'value(status.url)')
if [[ -z "${SERVICE_URL}" ]]; then
  echo "Service URL not found. Ensure the service is deployed and gcloud is configured." >&2
  exit 1
fi

echo "[smoke] Fetching web root..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "${SERVICE_URL}/")
echo "[smoke] Web HTTP ${HTTP_CODE} (${SERVICE_URL})"

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "[smoke] Unexpected status. Check logs: gcloud run services logs tail ${SERVICE_NAME} --project ${PROJECT_ID} --region ${RUN_REGION}" >&2
  exit 2
fi

echo "[smoke] Success"
