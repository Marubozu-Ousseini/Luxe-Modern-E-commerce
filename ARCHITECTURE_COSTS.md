# Approximate Monthly Cost Estimate

> Disclaimer: These figures are illustrative estimates for planning. Always verify current pricing on official provider pages (Google Cloud, Stripe). Actual costs depend on usage patterns, scaling, regions, free tier eligibility, and negotiated discounts. Currency: USD. Region: `europe-west1` (current project).

## Project-Specific Architecture (Current State)

- Domain: `malafaareh.com`; API subdomain intended: `api.malafaareh.com` (Cloud Run domain mapping pending verification).
- Backend/API: Cloud Run (Gen2) service `luxe-modern-ecommerce-api` in `europe-west1`.
  - Image: `europe-west1-docker.pkg.dev/aerobic-botany-479212-s7/luxe-repo/luxe-modern-e-commerce:latest` (Artifact Registry).
  - Resources: CPU `1`, Memory `512Mi`, Concurrency `80`, Scaling `min=0`, `max=5`, CPU throttling enabled (only during requests).
  - IAM: Public `allUsers` access removed; invoker is limited to the project’s serverless load balancer service account `service-<project-number>@serverless-robot-prod.iam.gserviceaccount.com`.
  - Deletion protection: disabled to allow Terraform updates.
- Jobs: Cloud Run Job `luxe-modern-ecommerce-api-reset-admin` (on-demand), deletion protection disabled; uses same image/secrets and mounts Cloud SQL socket when enabled.
- Database: Cloud SQL Postgres `luxe-postgres` (POSTGRES_15) in `europe-west1`.
  - Tier: `db-f1-micro`; IPv4 enabled; IAM auth flag `cloudsql.iam_authentication=on`.
  - Secrets: `db-password` stored in Secret Manager; `luxe_db` and `luxe_user` provisioned.
- Artifact Registry: Repository `luxe-repo` in `europe-west1` with reader IAM binding for the serverless service agent.
- Static hosting + CDN: Cloud Storage bucket `example-static-bucket-unique` fronted by global HTTPS load balancer + Cloud CDN.
- Monitoring: Cloud Monitoring uptime check created to hit `https://api.malafaareh.com/health` (will become active after domain mapping/cert issuance).
- Logging: Default project log bucket retention set to 30 days; log-based metric `db-connection-failures` enabled.

### Current Terraform Outputs

- Cloud Run URL: `https://luxe-modern-ecommerce-api-gvi2qpvs5q-ew.a.run.app` (direct URL requires authorized service account; use LB/domain once mapped).
- CDN/HTTPS LB IP: `136.110.132.74` (point apex and `www` A records here).
- Static Bucket: `example-static-bucket-unique`.

### DNS & Domain Mapping Status

- Cloud DNS managed zone exists (`malafaareh-zone`).
- Apex A record currently updated to point to `136.110.132.74` (HTTPS LB). `www` should also point to `136.110.132.74` (A record) for consistency.
- Cloud Run domain mapping for `api.malafaareh.com` is not yet created; Google Search Console domain verification is required for `malafaareh.com` under the active `gcloud` account.
  - After verification, run: `gcloud beta run domain-mappings create --service luxe-modern-ecommerce-api --domain api.malafaareh.com --region europe-west1 --project aerobic-botany-479212-s7` and apply the DNS records it outputs.

### Infra-as-Code References (this repo)

- Cloud Run Service/IAM: `infra/terraform/cloud_run.tf`
- Cloud Run Job: `infra/terraform/cloud_run_jobs.tf`
- Cloud SQL: `infra/terraform/cloud_sql.tf`
- Artifact Registry: `infra/terraform/artifact_registry.tf`
- CDN + HTTPS LB (static): `infra/terraform/storage_cdn.tf`
- Monitoring/Uptime: `infra/terraform/monitoring.tf`
- Logging retention/metrics: `infra/terraform/logging.tf`
- CI/CD (Cloud Build): `infra/terraform/ci_cd.tf` and `cloudbuild.yaml`

## Recommended Architecture (Cost-Optimized)

| Layer | Decision | Cost Impact |
| --- | --- | --- |
| Frontend | Build SPA with Vite, upload to Cloud Storage bucket behind Cloud CDN or Firebase Hosting. Long-lived assets cached 30–90 days; `/api/*` proxied to Cloud Run. | Eliminates VM/container runtime for static files; CDN hit ratio drives egress down. |
| Backend/API | Single Cloud Run service (`cpu=1`, `memory=512Mi`, `concurrency=80`, `min=0`, `max=5`, CPU only during requests), invoker restricted to serverless LB service account. | Keeps container warm only under load; throttled CPU removes idle billing; avoids public `allUsers` while enabling LB access. |
| Admin scripts | Package admin tooling as Cloud Run Jobs (on-demand). | Avoids PM2/VMs for maintenance tasks. |
| Database | Cloud SQL `db-f1-micro` (IPv4 enabled, IAM auth flag on). Default off unless relational features are required; Firestore/Firestore Lite viable interim. | Prevents $50+/mo idle DB when unneeded while keeping migration path ready. |
| Networking | Prefer Cloud SQL connector/PSC over Serverless VPC Connector. No egress-heavy load balancers other than CDN. | Removes ~$35/mo connector tax. |
| Secrets | Secret Manager for JWT/admin/db/Stripe; rotate per environment and pin versions in Terraform. | Pay only per secret-version stored; IAM enforces least privilege. |
| CI/CD | Cloud Build trigger on GitHub push. Kaniko layer caching + build artifacts staging. Deploy to Cloud Run + optional static bucket sync. | Reduces build minutes and repeated egress for assets. |
| Monitoring & Budgets | Log-based metrics for DB connection failures, log retention trimmed to 30 days, billing budget alerts at 50/80/100%. | Keeps Ops focused on actionable signals while capping storage/logging spend. |

Implementation notes live in `infra/terraform` (toggle flags, Cloud Build trigger, CDN bucket) and `cloudbuild.yaml` (cache + frontend artifact upload). Deployment runbooks document DNS + domain mapping.

## Implementation Checklist
1. **Split static hosting** – `vite.config.ts` now emits to `dist/client`, Cloud Build uploads to the CDN bucket, and Terraform manages the HTTPS load balancer in `storage_cdn.tf`.
2. **Right-size Cloud Run** – `cloud_run.tf` pins CPU/memory/concurrency, enables CPU throttling, and caps autoscaling at five instances.
3. **Database path** – `enable_cloud_sql` defaults to `false`; when enabled, `cloud_sql.tf` provisions a `db-f1-micro` instance with IAM auth secrets plus an on-demand Cloud Run job for admin resets.
4. **Secrets & config** – Secret Manager resources are centralized in `secrets.tf`, and `terraform.tfvars(.example)` documents every required secret override per environment.
5. **Infra-as-code coverage** – Terraform now declares Cloud Build triggers, logging retention, log metrics, uptime checks, budgets, CDN, and Cloud Run resources.
6. **Monitoring & budgets** – `logging.tf`, `monitoring.tf`, and `billing.tf` codify log retention (30 days), DB failure metrics, uptime check, and optional budget alerts.
7. **Cost guardrails** – Autoscaling min/max, Cloud Build caching, optional static deploy toggle, and Cloud SQL off-by-default keep spend predictable; docs highlight when to scale up.

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
