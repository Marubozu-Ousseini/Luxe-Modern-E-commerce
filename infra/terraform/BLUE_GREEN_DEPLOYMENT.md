# Blue-Green Deployment Guide

This guide explains how to use the Terraform configuration for zero-downtime deployments.

## Architecture

The updated Terraform configuration supports:
- **Multiple concurrent revisions**: Cloud Run keeps previous revisions available
- **Traffic splitting**: Percentage-based routing between revisions
- **Revision tagging**: Named URLs for testing specific versions
- **Automatic rollback**: Previous revisions remain deployable

## Deployment Workflow

### 1. Standard Deployment (100% Cutover)
```bash
terraform apply  # Default behavior
```

### 2. Canary Deployment (Gradual Rollout)
```bash
# Deploy with 10% traffic to new version
terraform apply \
  -var="enable_traffic_splitting=true" \
  -var="new_revision_traffic_percent=10" \
  -var="revision_tag=v2"

# Test the tagged revision URL
curl https://v2---luxe-modern-ecommerce-api-<hash>.europe-west1.run.app/health

# Monitor error rates, latency, etc.
# If metrics look good, increase traffic
terraform apply -var="new_revision_traffic_percent=50"
terraform apply -var="new_revision_traffic_percent=100"
```

### 3. Emergency Rollback
```bash
# Terraform rollback (reset to previous state)
terraform apply -var="new_revision_traffic_percent=0"

# Or use gcloud directly for immediate rollback
./scripts/rollback.sh <project-id>
```

## Best Practices

1. **Always test tagged revisions** before routing production traffic
2. **Monitor key metrics** during canary periods:
   - Error rate (target: <1% increase)
   - P95 latency (target: <10% increase)
   - Database connection failures (target: 0)
3. **Use small traffic increments**: 10% → 25% → 50% → 100%
4. **Set time windows**: Wait 15-30 minutes between traffic increases
5. **Automate checks**: Use uptime checks and alerting during rollouts

## CI/CD Integration

To enable automatic canary deployments in Cloud Build, update the trigger substitutions:

```yaml
# In Cloud Build trigger settings
_ENABLE_TRAFFIC_SPLIT: 'true'
_TRAFFIC_PERCENT: '10'
_REVISION_TAG: '${SHORT_SHA}'
```

## Troubleshooting

**Issue: New revision not receiving traffic**
```bash
# Check revision status
gcloud run revisions list --service=luxe-modern-ecommerce-api --region=europe-west1

# Verify traffic distribution
gcloud run services describe luxe-modern-ecommerce-api \
  --region=europe-west1 \
  --format="value(status.traffic)"
```

**Issue: Old revision consuming resources**
```bash
# Clean up old revisions (keeps last 3)
gcloud run revisions list --service=luxe-modern-ecommerce-api \
  --region=europe-west1 \
  --format="value(name)" \
  --sort-by="~metadata.creationTimestamp" \
  | tail -n +4 \
  | xargs -I {} gcloud run revisions delete {} --region=europe-west1 --quiet
```
