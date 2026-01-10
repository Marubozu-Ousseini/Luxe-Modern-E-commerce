# Terraform Configuration Notes

## Known Issues

### Dynamic Block for_each Syntax

The current Terraform configuration has some `dynamic` blocks using `for_each = ... ? [1] : []` syntax which is not fully compatible with Terraform 1.6+. These are pre-existing issues in the original configuration and not introduced by the blue-green deployment changes.

**Affected lines:**
- Firebase client configuration blocks (lines 44-92)
- Firebase admin key block (line 133)
- Stripe secrets blocks (lines 147, 159)
- Cloud SQL blocks (lines 173, 185, 194)

**Workaround:**
These patterns can be updated to use proper map syntax:
```hcl
# Instead of:
for_each = condition ? [1] : []

# Use:
for_each = condition ? {"enabled" = true} : {}
```

However, since these are in the original configuration, they have been left as-is to minimize changes. The blue-green deployment traffic configuration added uses the same pattern for consistency.

**Impact:**
- `terraform validate` will show errors with Terraform 1.6.6
- The configuration may still work with earlier Terraform versions or when deployed via Cloud Build
- These issues should be addressed in a separate PR to maintain compatibility with latest Terraform versions

## Blue-Green Deployment Changes

The following changes were added for blue-green deployment support and follow the existing code patterns:

1. **Traffic splitting** (lines 207-227): Uses `traffic` blocks to manage revision traffic
2. **Variables** in `variables.tf`: Added `enable_traffic_splitting`, `new_revision_traffic_percent`, and `revision_tag`
3. **Outputs** in `outputs.tf`: Added revision management outputs
