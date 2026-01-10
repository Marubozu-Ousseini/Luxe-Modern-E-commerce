#!/bin/bash
set -e

PROJECT_ID="${1:-}"
SERVICE_NAME="${2:-luxe-modern-ecommerce-api}"
REGION="${3:-europe-west1}"

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 <project-id> [service-name] [region]"
  exit 1
fi

echo "Rolling back to previous revision..."

gcloud run services update-traffic "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --to-revisions PREVIOUS=100

echo "✅ Rollback complete."
