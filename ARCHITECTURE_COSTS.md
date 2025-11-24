# Approximate Monthly Cost Estimate

> Disclaimer: These figures are illustrative estimates for planning. Always verify current pricing on official provider pages (Google Cloud, Stripe). Actual costs depend on usage patterns, scaling, regions, free tier eligibility, and negotiated discounts. Currency: USD. Region assumed: `us-central1`.

## Assumptions (Baseline Scenario)
- Cloud Run service:
  - 1 container (API) with 1 vCPU / 1 GiB memory.
  - Average active utilization: 50% of the month (360 hours ≈ 1,296,000 seconds) due to autoscaling (idle time not billed).
  - 2 million HTTP requests/month; 5% egress outside same region (0.5 GiB egress).
- Cloud SQL Postgres:
  - Instance tier: `db-f1-micro`.
  - 10 GB storage; automatic backups retained (approx. equal to data size; counted once).
  - Low connection count (≤ 20), mostly short transactions.
- Artifact Registry:
  - 5 images retained (each 300 MB after build optimization) ≈ 1.5 GB stored.
- Cloud Build:
  - 60 builds/month; each ~8 build minutes (small Node/TypeScript + Docker build) = 480 build minutes.
- Cloud Storage Static Bucket + Cloud CDN:
  - 10 GB of static assets (compressed build artifacts, images).
  - 200 GB/month egress served via CDN (80% cache hit assumed, blended pricing). Small project scale.
- Secrets (Secret Manager):
  - 6 secrets (jwt-secret, admin-password, db-password, stripe-secret-key, stripe-webhook-secret, database-url) each with 2 versions.
- Logging & Monitoring:
  - < 50 GiB ingested (within free tier for basic usage). Retention default (30 days standard logs).
- Stripe Payments:
  - 1,000 successful card transactions; average order value (AOV) $50.

## Component Cost Breakdown (Estimated)

### 1. Cloud Run (API)
- vCPU: 1,296,000 sec × $0.000024 ≈ $31.10
- Memory: 1,296,000 sec × $0.0000027 ≈ $3.50
- Requests: (2M × $0.40 per million after free tier offset) ≈ $0.80 (assuming free tier covers first 100k–200k requests; adjust if exceeded).
- Network egress (0.5 GiB region → internet): ≈ $0.05
- Total (Cloud Run): ≈ **$35.45**

### 2. Cloud SQL (Postgres)
- Instance (`db-f1-micro`): ≈ $7.30
- Storage: 10 GB × $0.10/GB ≈ $1.00
- Backups (roughly same size, often included in storage tier depending on settings): ≈ $1.00
- Total (Cloud SQL): ≈ **$9.30**

### 3. Artifact Registry
- Storage: 1.5 GB × $0.10/GB ≈ $0.15
- Minimal network (pulls within same region typically free).
- Total (Artifact Registry): ≈ **$0.15**

### 4. Cloud Build
- Build minutes: 480 × $0.003 ≈ $1.44 (first 120 free → billable 360 → $1.08). To simplify: ≈ **$1.10**

### 5. Cloud Storage + Cloud CDN
- Storage: 10 GB × $0.02/GB ≈ $0.20
- CDN egress (effective blended small volume rate ~ $0.08/GB × 200 GB) ≈ $16.00 (HIGHLY variable by geo & cache hit).
- Total (Static + CDN): ≈ **$16.20**

### 6. Secret Manager
- Secret versions: 6 secrets × 2 versions = 12 versions × $0.06 ≈ $0.72
- API access operations (low) ~ negligible charges.
- Total (Secrets): ≈ **$0.72**

### 7. Logging & Monitoring
- Estimated within free tier (≤ 50 GiB ingestion). Cost: **$0.00** (may rise with higher volume).

### 8. Stripe Processing Fees
- Fee model (typical US cards): 2.9% + $0.30 per successful charge.
- Per transaction average fee: 0.029 × $50 + $0.30 = $1.45 + $0.30 = $1.75
- 1,000 transactions: ≈ $1,750
- Total (Stripe Fees): ≈ **$1,750.00**

### 9. Miscellaneous / Overhead
- Terraform operations: negligible (just API calls).
- Occasional Cloud Run revisions & image garbage collection: negligible.

## Summary (Rounded)
| Component | Estimated Monthly |
|-----------|------------------|
| Cloud Run | $35 |
| Cloud SQL | $9 |
| Artifact Registry | $0.15 |
| Cloud Build | $1.1 |
| Storage + CDN | $16 |
| Secret Manager | $0.7 |
| Logging & Monitoring | $0 |
| Stripe Fees | $1,750 |
| **Total (Infra excl. Stripe)** | **~$62** |
| **Grand Total (incl. Stripe)** | **~$1,812** |

> Stripe dominates the cost at this transaction volume/AOV. Infra itself stays relatively low due to serverless + micro tier DB.

## Optimization Levers
- Reduce Cloud Run active time by tuning concurrency (e.g., raise concurrency to 80 to reduce instances/time).
- Upgrade Cloud SQL only when CPU or connection metrics justify (monitor using Query Insights & CPU utilization).
- Enable page/image compression and aggressive CDN caching to reduce egress.
- Implement image pruning in Artifact Registry (keep N latest tags) to cap storage.
- Consolidate secrets (only rotate when needed) to minimize version counts.
- Consider Stripe fee optimization (local payment methods with lower fees, negotiated rates at volume).

## Scaling Scenarios
- Light Traffic (10% of baseline): Infra ≈ $15–$20/month; Stripe proportionally lower.
- Medium (baseline above): Infra ≈ $60–$80/month.
- Heavy (10× requests & 10× CDN egress): Cloud Run may reach $300–$400; CDN egress proportionally ≈ $160; evaluate dedicated DB tier (e.g. `db-g1-small` or `db-custom`).

## Monitoring & Alerts Suggestions
- Set budgets in GCP Billing (alert at 80% of monthly budget $100 infra).
- Create Cloud Monitoring uptime check for API & DB connectivity.
- Track Cloud Run metrics: `container/instance_count`, `request_count`, `execution_time`.
- Track Cloud SQL: CPU %, active connections, slow queries.

## Caveats
- Free tiers (Cloud Run, Cloud Build) may offset costs further early on.
- Network egress and CDN costs vary significantly by geography & cache hit ratio.
- Stripe fees vary by payment method, country, and negotiated volume discounts.
- Real Postgres storage/backups may diverge; consider point-in-time recovery overhead.

## Next Steps
1. Replace placeholders in `terraform.tfvars` and run `terraform apply`.
2. Set GCP budget alerts aligned with the above approximate infra baseline ($75 monthly cushion).
3. Instrument custom metrics (order success, payment latency) to correlate cost vs. business value.
4. Revisit estimates quarterly as traffic or data footprint changes.

---
Generated automatically as a planning aid. Update numbers as soon as real usage metrics are available.
