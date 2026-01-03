#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID:=malafaareh-481713}"
: "${RUN_REGION:=europe-west1}"
: "${SERVICE_NAME:=luxe-modern-ecommerce-api}"

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${RUN_REGION}" --format 'value(status.url)')
if [[ -z "${SERVICE_URL}" ]]; then
  echo "Service URL not found. Ensure the service is deployed and gcloud is configured." >&2
  exit 1
fi

echo "[smoke] Checking health endpoint..."
curl -sSf "${SERVICE_URL}/health" && echo " [OK]"

echo "[smoke] Fetching homepage..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "${SERVICE_URL}")
echo "[smoke] Homepage HTTP ${HTTP_CODE}"

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "[smoke] Unexpected homepage status. Check logs: gcloud run services logs tail ${SERVICE_NAME} --region ${RUN_REGION}" >&2
  exit 2
fi

echo "[smoke] Success: ${SERVICE_URL} is serving client and /health is OK"
