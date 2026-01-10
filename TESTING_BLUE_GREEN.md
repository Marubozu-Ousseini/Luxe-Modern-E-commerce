# Testing Blue-Green Deployment Implementation

This document provides step-by-step instructions for testing the blue-green deployment implementation.

## Prerequisites

- GCP project with Cloud Run API enabled
- `gcloud` CLI configured
- Terraform installed (version 1.5+ recommended)
- Access to the GCP project with appropriate permissions

## Test 1: Backward Compatibility (Default Behavior)

**Objective**: Verify that the default configuration works unchanged.

```bash
cd infra/terraform

# Initialize Terraform (if not already done)
terraform init

# Plan with default values
terraform plan

# Expected: Should show traffic configuration with 100% to latest
# Look for: traffic block with percent = 100
```

**Expected Result**: 
- Terraform plan succeeds without errors
- Traffic is configured to route 100% to latest revision
- No breaking changes to existing deployment workflow

## Test 2: Enable Traffic Splitting with 10% Canary

**Objective**: Test deploying a canary release with 10% traffic.

```bash
# Create a tfvars file for testing
cat > test-canary.tfvars << EOF
enable_traffic_splitting = true
new_revision_traffic_percent = 10
revision_tag = "canary-test"
EOF

# Plan with canary configuration
terraform plan -var-file=test-canary.tfvars

# Expected: Should show two traffic blocks
# - 10% to latest with tag "canary-test"
# - 90% to previous revision
```

**Expected Result**:
- Terraform plan shows traffic split configuration
- Lifecycle ignore_changes is applied to traffic block
- No errors in validation

## Test 3: Verify Traffic Splitting Variables

**Objective**: Ensure variables are properly validated.

```bash
# Test invalid traffic percentage (should fail validation)
terraform plan -var="enable_traffic_splitting=true" \
               -var="new_revision_traffic_percent=150"

# Expected: Should fail with validation error
# "Traffic percentage must be between 0 and 100."

# Test valid traffic percentage
terraform plan -var="enable_traffic_splitting=true" \
               -var="new_revision_traffic_percent=50"

# Expected: Should succeed with 50/50 split
```

**Expected Result**:
- Invalid values are rejected with clear error messages
- Valid values pass validation

## Test 4: Cloud Build Configuration

**Objective**: Verify Cloud Build supports the new substitutions.

```bash
# Review cloudbuild.yaml for new substitutions
grep -A 3 "substitutions:" cloudbuild.yaml

# Expected to see:
# _REVISION_TAG: "${SHORT_SHA}"
# _TRAFFIC_PERCENT: "100"
# _ENABLE_TRAFFIC_SPLIT: "false"
```

**Expected Result**:
- Substitutions are properly defined
- Default values maintain backward compatibility
- Dynamic substitutions are enabled

## Test 5: Deployment Scripts

**Objective**: Verify deployment helper scripts are executable and have proper syntax.

```bash
# Check scripts are executable
ls -l scripts/*.sh | grep "deploy-canary\|rollback\|promote-canary"

# Expected: All three scripts should have execute permissions (rwxr-xr-x)

# Test script syntax (dry run)
bash -n scripts/deploy-canary.sh
bash -n scripts/rollback.sh
bash -n scripts/promote-canary.sh

# Expected: No syntax errors

# Test usage messages
./scripts/deploy-canary.sh
./scripts/rollback.sh
./scripts/promote-canary.sh

# Expected: Each should display usage information
```

**Expected Result**:
- All scripts are executable
- No bash syntax errors
- Clear usage messages when run without arguments

## Test 6: Outputs Configuration

**Objective**: Verify new outputs are properly configured.

```bash
# Check outputs in outputs.tf
grep -A 3 "cloud_run_latest_revision\|cloud_run_revision_url\|cloud_run_traffic_distribution" infra/terraform/outputs.tf

# Expected: Three new outputs defined with proper descriptions
```

**Expected Result**:
- Outputs reference correct Cloud Run service attributes
- Descriptions are clear and helpful

## Test 7: Documentation

**Objective**: Ensure documentation is complete and accurate.

**Check README.md**:
```bash
# Verify Blue-Green Deployment section exists
grep -A 10 "Blue-Green Deployment" README.md

# Expected: Section with deployment examples and commands
```

**Check BLUE_GREEN_DEPLOYMENT.md**:
```bash
# Verify comprehensive guide exists
ls -l infra/terraform/BLUE_GREEN_DEPLOYMENT.md

# Review content
cat infra/terraform/BLUE_GREEN_DEPLOYMENT.md | head -50

# Expected: Architecture, workflows, best practices, troubleshooting
```

**Expected Result**:
- All documentation is present and comprehensive
- Examples are clear and actionable
- Troubleshooting guide addresses common issues

## Test 8: Environment Variables

**Objective**: Verify .env.example includes deployment variables.

```bash
# Check for deployment strategy variables
grep -A 2 "Blue-Green Deployment" .env.example

# Expected:
# DEPLOYMENT_STRATEGY=blue-green
# CANARY_TRAFFIC_PERCENT=10
```

**Expected Result**:
- New variables are documented
- Default values are sensible

## Integration Test (If GCP Access Available)

**Objective**: Full end-to-end test with actual deployment.

```bash
# 1. Deploy with default configuration
cd infra/terraform
terraform apply -auto-approve

# 2. Verify service is running
gcloud run services describe luxe-modern-ecommerce-api \
  --region europe-west1 \
  --format="value(status.traffic)"

# 3. Deploy canary with 10% traffic
terraform apply \
  -var="enable_traffic_splitting=true" \
  -var="new_revision_traffic_percent=10" \
  -var="revision_tag=canary-v2" \
  -auto-approve

# 4. Verify traffic split
gcloud run services describe luxe-modern-ecommerce-api \
  --region europe-west1 \
  --format="table(status.traffic[].tag, status.traffic[].percent)"

# 5. Test tagged URL
TAGGED_URL=$(terraform output -raw cloud_run_revision_url)
curl -I "$TAGGED_URL/health"

# 6. Promote canary to 100%
./scripts/promote-canary.sh <project-id>

# 7. Verify 100% traffic
gcloud run services describe luxe-modern-ecommerce-api \
  --region europe-west1 \
  --format="value(status.traffic)"

# 8. Test rollback
./scripts/rollback.sh <project-id>

# 9. Verify rollback
gcloud run services describe luxe-modern-ecommerce-api \
  --region europe-west1 \
  --format="value(status.traffic)"
```

**Expected Results**:
1. Service deploys successfully with 100% traffic to latest
2. Traffic split applies correctly (10% canary, 90% previous)
3. Tagged revision URL is accessible
4. Promotion moves 100% traffic to new revision
5. Rollback successfully reverts to previous revision

## Troubleshooting

### Issue: Terraform validation errors about dynamic blocks

**Cause**: Pre-existing syntax compatibility issues with Terraform 1.6+

**Solution**: These are documented in `infra/terraform/README.md` and don't affect the blue-green deployment functionality

### Issue: Traffic not splitting as expected

**Check**:
```bash
# Verify variables are set
terraform show -json | jq '.values.root_module.resources[] | select(.type=="google_cloud_run_v2_service") | .values.traffic'

# Verify lifecycle ignore_changes is working
terraform plan | grep "traffic"
```

### Issue: Scripts fail with permission denied

**Solution**:
```bash
chmod +x scripts/deploy-canary.sh scripts/rollback.sh scripts/promote-canary.sh
```

## Success Criteria

✅ All tests pass without errors
✅ Backward compatibility maintained (default behavior unchanged)
✅ Traffic splitting works as configured
✅ Scripts are executable and functional
✅ Documentation is complete and accurate
✅ No security vulnerabilities introduced

## Regression Testing

Before considering this PR complete, ensure:

1. Existing deployments continue to work (default config)
2. No breaking changes to CI/CD pipeline
3. All environment variables remain compatible
4. Load balancer and networking configurations unchanged
5. IAM permissions remain appropriate
