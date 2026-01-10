# Production Deployment Guide - 100% Traffic Rollout

This guide provides step-by-step instructions for deploying the application to production with 100% traffic.

## Prerequisites

Before deploying to production, ensure:

- [x] Database migration `005_add_user_favorites.sql` has been applied
- [x] All tests pass locally (`npm test`)
- [x] Code has been reviewed and approved
- [x] Staging environment tested successfully
- [x] Monitoring and alerting configured
- [x] Rollback plan documented

## Deployment Options

### Option 1: Automated Script (Recommended)

Use the production deployment script for a safe, guided deployment:

```bash
./scripts/deploy-production.sh <project-id>
```

**Example:**
```bash
./scripts/deploy-production.sh malafaareh-481713
```

**What the script does:**
1. ✅ Validates service exists
2. ✅ Shows current traffic distribution
3. ✅ Identifies latest revision
4. ✅ Routes 100% traffic to latest
5. ✅ Verifies deployment
6. ✅ Tests health endpoint
7. ✅ Provides monitoring commands

### Option 2: Terraform Deployment

Deploy using Terraform with default settings (100% traffic):

```bash
cd infra/terraform

# Initialize if needed
terraform init

# Review changes
terraform plan

# Apply deployment
terraform apply
```

**With explicit traffic configuration:**
```bash
terraform apply \
  -var="enable_traffic_splitting=false" \
  -var="new_revision_traffic_percent=100"
```

### Option 3: Cloud Build Trigger

Deploy via Cloud Build with 100% traffic:

```bash
# Trigger deployment via Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_DEPLOY_CLOUD_RUN=true,_ENABLE_TRAFFIC_SPLIT=false,_TRAFFIC_PERCENT=100
```

### Option 4: Manual gcloud Command

Direct deployment using gcloud:

```bash
# Set variables
PROJECT_ID="malafaareh-481713"
SERVICE_NAME="luxe-modern-ecommerce-api"
REGION="europe-west1"

# Deploy with 100% traffic
gcloud run services update-traffic $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --to-latest
```

## Pre-Deployment Checklist

### 1. Database Migration

Ensure the user favorites migration has been applied:

```bash
# Check if migration is needed
psql -h <db-host> -U luxe_user -d luxe_db -c "\d user_favorites"

# If table doesn't exist, apply migration
psql -h <db-host> -U luxe_user -d luxe_db -f migrations/005_add_user_favorites.sql
```

**Or via Terraform:**
```bash
cd infra/terraform
terraform apply -var="enable_cloud_sql=true"
```

### 2. Code Validation

Run validation script:

```bash
./scripts/validate-favorites.sh
```

Expected output:
```
✅ Migration file exists
✅ userFavorites table defined
✅ PostgreSQL support implemented
✅ FavoritesContext exists
✅ API client exists
✅ 3 components use favorites
✅ Tests exist
```

### 3. Local Testing

Test the application locally:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Test favorites feature
# - Login as user
# - Toggle favorites on products
# - Verify API calls in browser DevTools
# - Check favorites persist across sessions
```

### 4. Build Verification

Verify the build succeeds:

```bash
# Build client
npm run build:client

# Build server
npm run build:server

# Check dist/ directory
ls -la dist/
```

## Deployment Process

### Step 1: Review Current State

```bash
PROJECT_ID="malafaareh-481713"
SERVICE_NAME="luxe-modern-ecommerce-api"
REGION="europe-west1"

# Check current service
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID

# View current traffic distribution
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format="table(status.traffic.revisionName,status.traffic.percent)"

# List revisions
gcloud run revisions list \
  --service=$SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID
```

### Step 2: Deploy to Production

**Using the automated script:**
```bash
./scripts/deploy-production.sh malafaareh-481713
```

The script will:
- Show current traffic distribution
- Prompt for confirmation
- Route 100% traffic to latest revision
- Verify deployment
- Test health endpoint
- Display monitoring commands

### Step 3: Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format="value(status.url)")

echo "Service URL: $SERVICE_URL"

# Test health endpoint
curl $SERVICE_URL/health

# Test API endpoints
curl -X GET $SERVICE_URL/api/products

# Test with authentication (if applicable)
curl -X GET $SERVICE_URL/api/favorites \
  -H "Authorization: Bearer <token>" \
  -H "Cookie: session=<session-cookie>"
```

### Step 4: Monitor Deployment

**View logs:**
```bash
# Real-time logs
gcloud logging tail "resource.type=cloud_run_revision" \
  --project=$PROJECT_ID

# Recent logs
gcloud logging read "resource.type=cloud_run_revision" \
  --project=$PROJECT_ID \
  --limit=50 \
  --format=json

# Filter by severity
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --project=$PROJECT_ID \
  --limit=20
```

**Monitor metrics:**
```bash
# View Cloud Run metrics in console
open "https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"

# Or use gcloud
gcloud monitoring time-series list \
  --filter="resource.type=cloud_run_revision" \
  --project=$PROJECT_ID
```

**Check revision status:**
```bash
# List all revisions with status
gcloud run revisions list \
  --service=$SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(name,status.conditions[0].type,status.conditions[0].status,metadata.creationTimestamp)"
```

## Post-Deployment Verification

### 1. Functional Testing

Test critical user flows:

**Test 1: User Registration/Login**
```bash
# Test registration
curl -X POST $SERVICE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Test login
curl -X POST $SERVICE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Test 2: Product Listing**
```bash
# Get products
curl $SERVICE_URL/api/products
```

**Test 3: Favorites Feature**
```bash
# Get favorites (requires auth)
curl -X GET $SERVICE_URL/api/favorites \
  -H "Authorization: Bearer <token>"

# Toggle favorite
curl -X POST $SERVICE_URL/api/favorites/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"productId":42}'
```

### 2. Database Verification

Check the database for favorites:

```bash
# Connect to database
gcloud sql connect <instance-name> --user=luxe_user --database=luxe_db

# In psql:
# Check user_favorites table
SELECT * FROM user_favorites LIMIT 10;

# Count favorites
SELECT COUNT(*) FROM user_favorites;

# Check by user
SELECT u.email, COUNT(uf.id) as favorites_count
FROM users u
LEFT JOIN user_favorites uf ON u.id = uf.user_id
GROUP BY u.id, u.email
ORDER BY favorites_count DESC
LIMIT 10;
```

### 3. Performance Check

Monitor key metrics:

- **Request latency**: Should be < 500ms for 95th percentile
- **Error rate**: Should be < 1%
- **CPU utilization**: Should be < 80%
- **Memory usage**: Should be < 80% of allocated
- **Cold start time**: Should be < 3 seconds

### 4. Security Verification

```bash
# Check SSL/TLS
curl -vI $SERVICE_URL 2>&1 | grep "SSL\|TLS"

# Verify CORS headers
curl -H "Origin: https://malafaareh.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS $SERVICE_URL/api/favorites/toggle -v

# Check authentication
curl $SERVICE_URL/api/favorites
# Should return 401 Unauthorized
```

## Rollback Procedure

If issues are detected, immediately rollback:

### Option 1: Using Rollback Script

```bash
./scripts/rollback.sh malafaareh-481713
```

### Option 2: Manual Rollback

```bash
# Route traffic to previous revision
gcloud run services update-traffic $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --to-revisions PREVIOUS=100

# Or to specific revision
gcloud run services update-traffic $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --to-revisions <revision-name>=100
```

### Option 3: Terraform Rollback

```bash
cd infra/terraform

# Revert to previous state
git checkout HEAD~1 infra/terraform/

# Apply previous configuration
terraform apply
```

## Monitoring and Alerting

### Set Up Alerts

Create alerts for critical metrics:

**Error Rate Alert:**
```bash
gcloud alpha monitoring policies create \
  --notification-channels=<channel-id> \
  --display-name="Cloud Run Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s
```

**Latency Alert:**
```bash
gcloud alpha monitoring policies create \
  --notification-channels=<channel-id> \
  --display-name="Cloud Run High Latency" \
  --condition-display-name="P95 latency > 1s" \
  --condition-threshold-value=1000 \
  --condition-threshold-duration=300s
```

### Continuous Monitoring

Monitor these dashboards:

1. **Cloud Run Metrics Dashboard**
   - Request count
   - Request latency
   - Error rate
   - Container CPU/Memory

2. **Cloud SQL Dashboard**
   - Connection count
   - Query latency
   - Transaction rate

3. **Application Logs**
   - Error logs
   - Warning logs
   - User activity

## Troubleshooting

### Issue: Service Not Responding

```bash
# Check service status
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID

# Check recent errors
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20 \
  --project=$PROJECT_ID
```

### Issue: High Error Rate

```bash
# Check error logs
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=50 \
  --project=$PROJECT_ID \
  --format=json

# Check for specific errors
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'database'" \
  --limit=20 \
  --project=$PROJECT_ID
```

### Issue: Database Connection Failures

```bash
# Check Cloud SQL instance
gcloud sql instances describe <instance-name> \
  --project=$PROJECT_ID

# Check connections
gcloud sql operations list \
  --instance=<instance-name> \
  --project=$PROJECT_ID

# Test connection from Cloud Run
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --set-env-vars="DB_DEBUG=true"
```

### Issue: Favorites Not Working

```bash
# Check API endpoint
curl -X GET $SERVICE_URL/api/favorites \
  -H "Authorization: Bearer <token>" \
  -v

# Check database table
psql -h <db-host> -U luxe_user -d luxe_db -c "SELECT * FROM user_favorites LIMIT 5;"

# Check API logs
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'favorites'" \
  --limit=20 \
  --project=$PROJECT_ID
```

## Success Criteria

✅ **Deployment Successful If:**
- Service responds to health checks
- Error rate < 1%
- P95 latency < 500ms
- All critical user flows work
- Database queries succeed
- Favorites feature functional
- No critical errors in logs
- Metrics within normal range

## Documentation

Related documentation:
- `IMPLEMENTATION_SUMMARY.md` - Overall architecture
- `FRONTEND_INTEGRATION_STATUS.md` - Favorites feature details
- `MERGE_GUIDE.md` - Integration guide
- `TESTING_BLUE_GREEN.md` - Testing procedures
- `infra/terraform/BLUE_GREEN_DEPLOYMENT.md` - Blue-green deployment strategies

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs in Cloud Console
3. Verify database connectivity
4. Check environment variables
5. Review recent code changes
6. Rollback if necessary

For emergency support:
- Rollback: `./scripts/rollback.sh <project-id>`
- View logs: `gcloud logging tail "resource.type=cloud_run_revision"`
- Contact: Team lead or DevOps on-call

## Maintenance Window

**Recommended deployment times:**
- Off-peak hours: 2-4 AM local time
- Avoid: Friday afternoons, holidays
- Duration: 15-30 minutes typical
- Communication: Notify stakeholders 24h advance

## Post-Deployment Tasks

After successful deployment:

1. ✅ Update deployment log
2. ✅ Notify stakeholders of completion
3. ✅ Monitor for 1-2 hours
4. ✅ Update documentation if needed
5. ✅ Clean up old revisions (keep last 3)
6. ✅ Review metrics and create report
7. ✅ Update runbook with lessons learned

---

**Last Updated:** 2026-01-10  
**Version:** 1.0.0  
**Maintained By:** DevOps Team
