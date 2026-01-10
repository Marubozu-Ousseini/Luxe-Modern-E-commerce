#!/bin/bash
set -e

PROJECT_ID="${1:-}"
SERVICE_NAME="${2:-luxe-modern-ecommerce-api}"
REGION="${3:-europe-west1}"
TRAFFIC_PERCENT="${4:-10}"

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 <project-id> [service-name] [region] [traffic-percent]"
  exit 1
fi

echo "Deploying canary with ${TRAFFIC_PERCENT}% traffic..."

# Get the latest revision
LATEST_REVISION=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format="value(status.latestReadyRevisionName)")

echo "Latest revision: $LATEST_REVISION"

# Route traffic
gcloud run services update-traffic "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --to-revisions "$LATEST_REVISION=$TRAFFIC_PERCENT" \
  --to-latest="$((100 - TRAFFIC_PERCENT))"

echo "✅ Canary deployment complete. Monitor metrics before promoting."
