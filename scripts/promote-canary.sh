#!/bin/bash
set -e

PROJECT_ID="${1:-}"
SERVICE_NAME="${2:-luxe-modern-ecommerce-api}"
REGION="${3:-europe-west1}"

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 <project-id> [service-name] [region]"
  exit 1
fi

echo "Promoting canary to 100% traffic..."

gcloud run services update-traffic "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --to-latest

echo "✅ Promotion complete. New version receiving 100% traffic."
