#!/bin/bash
# Production Deployment Script - 100% Traffic to Latest Revision
# This script deploys the application to production with full traffic

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${1:-}"
SERVICE_NAME="${2:-luxe-modern-ecommerce-api}"
REGION="${3:-europe-west1}"

# Function to print colored output
print_info() {
    echo -e "${GREEN}ℹ ${NC}$1"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Validate inputs
if [ -z "$PROJECT_ID" ]; then
    print_error "Usage: $0 <project-id> [service-name] [region]"
    echo ""
    echo "Example:"
    echo "  $0 malafaareh-481713"
    echo "  $0 malafaareh-481713 luxe-modern-ecommerce-api europe-west1"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       Production Deployment - 100% Traffic Rollout          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
print_info "Project ID: $PROJECT_ID"
print_info "Service: $SERVICE_NAME"
print_info "Region: $REGION"
echo ""

# Confirm deployment
print_warning "This will deploy 100% traffic to the latest revision in production."
read -p "Do you want to proceed? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    print_error "Deployment cancelled."
    exit 0
fi

echo ""
print_info "Step 1: Checking current service status..."
if ! gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format="value(metadata.name)" > /dev/null 2>&1; then
    print_error "Service '$SERVICE_NAME' not found in region '$REGION'"
    exit 1
fi
print_success "Service found"

echo ""
print_info "Step 2: Getting current traffic distribution..."
CURRENT_TRAFFIC=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format="table(status.traffic.revisionName,status.traffic.percent)")
echo "$CURRENT_TRAFFIC"

echo ""
print_info "Step 3: Getting latest revision..."
LATEST_REVISION=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format="value(status.latestReadyRevisionName)")
print_success "Latest revision: $LATEST_REVISION"

echo ""
print_info "Step 4: Routing 100% traffic to latest revision..."
if gcloud run services update-traffic "$SERVICE_NAME" \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --to-latest \
    --quiet; then
    print_success "Traffic successfully routed to latest revision"
else
    print_error "Failed to update traffic"
    exit 1
fi

echo ""
print_info "Step 5: Verifying deployment..."
sleep 3
NEW_TRAFFIC=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format="table(status.traffic.revisionName,status.traffic.percent)")
echo "$NEW_TRAFFIC"

echo ""
print_info "Step 6: Getting service URL..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --format="value(status.url)")
print_success "Service URL: $SERVICE_URL"

echo ""
print_info "Step 7: Testing health endpoint..."
if curl -s -f "$SERVICE_URL/health" > /dev/null 2>&1; then
    print_success "Health check passed"
else
    print_warning "Health check failed or endpoint not available"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              Deployment Complete! 🚀                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
print_success "✅ 100% traffic now routed to: $LATEST_REVISION"
print_success "✅ Service URL: $SERVICE_URL"
echo ""
print_info "Next steps:"
echo "  1. Monitor application metrics in Cloud Console"
echo "  2. Check logs: gcloud logging read \"resource.type=cloud_run_revision\" --limit 50"
echo "  3. If issues occur, rollback with: ./scripts/rollback.sh $PROJECT_ID"
echo ""
print_info "Monitoring commands:"
echo "  # View logs"
echo "  gcloud logging read \"resource.type=cloud_run_revision\" \\"
echo "    --project=$PROJECT_ID \\"
echo "    --limit 50"
echo ""
echo "  # Check revision status"
echo "  gcloud run revisions list \\"
echo "    --service=$SERVICE_NAME \\"
echo "    --region=$REGION \\"
echo "    --project=$PROJECT_ID"
echo ""
