# Terraform - GCP Infrastructure (Free Tier Friendly)

This Terraform stack now aligns with the recommended low-cost architecture:
- Cloud Run (Gen2) API service with CPU throttling, 512 MiB RAM, concurrency 80, autoscaling guardrails, and optional Cloud SQL attachment.
- Cloud Run job for admin-password reset (only when Cloud SQL is on).
- Cloud Storage bucket + optional global HTTPS load balancer with Cloud CDN for the React SPA.
- Secret Manager for JWT/admin/db/Stripe secrets.
- Optional Cloud SQL Postgres (`db-f1-micro`, private IP only) that can be toggled via `enable_cloud_sql`.
- Cloud Build trigger (GitHub) with Kaniko caching, optional static upload, and deployment to Cloud Run.
- Log retention controls, log-based metrics for DB failures, uptime checks, and optional budget alerts.

## Prerequisites
- A GCP project with billing enabled
- `gcloud` authenticated (`gcloud auth application-default login`)
- Terraform >= 1.5
- Enable APIs (Terraform can enable implicitly when creating resources, but you may pre-enable):
  - run.googleapis.com, compute.googleapis.com, secretmanager.googleapis.com, storage.googleapis.com

## Variables
Create a `terraform.tfvars` with:

```
project_id              = "<your-gcp-project-id>"
region                  = "europe-west1"
domain                  = "malafaareh.com"
api_subdomain           = "api.malafaareh.com"
bucket_name             = "malafaareh-static-<random>"
artifact_repo_id        = "luxe-repo"
cloud_run_image         = "europe-west1-docker.pkg.dev/<project>/luxe-repo/luxe-api:latest"
cloud_run_service_name  = "luxe-modern-ecommerce-api"
allowed_origins         = "https://www.malafaareh.com,https://malafaareh.com"
cookie_domain           = ".malafaareh.com"
jwt_secret              = "<strong-random>"
admin_email             = "admin@malafaareh.com"
admin_password          = "<initial-strong-password>"
stripe_secret_key       = "sk_live_..."    # optional
stripe_webhook_secret   = "whsec_..."       # optional
enable_cloud_sql        = false             # turn on when Postgres is needed
enable_reset_admin_job  = true              # requires Cloud SQL
enable_cloud_build_trigger = true
deploy_static_from_ci   = true
log_retention_days      = 30
uptime_check_enabled    = true
billing_account_id      = ""               # optional budgets
```

## Apply

```
terraform init
terraform plan
terraform apply
```

Outputs:
- `cloud_run_url`: Temporary URL for API
- `lb_ip_run`: Global IP of the HTTPS Load Balancer that fronts Cloud Run (private ingress). Point apex + `www` here for the main site.
- `lb_ip_static`: Global IP of the optional CDN HTTPS Load Balancer (if you choose to serve the SPA from GCS+CDN instead).
- `static_bucket`: Bucket receiving the Vite build (if using CDN)

## DNS
- Recommended: Create A records for `malafaareh.com` and `www.malafaareh.com` pointing to `lb_ip_run` (the Cloud Run HTTPS LB). This keeps Cloud Run private (ingress: internal LB) while serving the site publicly.
- Optional (CDN path): If serving the SPA from GCS+CDN, point apex + `www` to `lb_ip_static` instead, and ensure static assets are uploaded to the `static_bucket`.
- API subdomain: If using a separate API domain, you can enable Cloud Run domain mappings by setting `enable_cloud_run_domain_mapping=true`, then follow the output `api_domain_records` to configure DNS. Otherwise, the API is reachable behind the same `lb_ip_run` under your chosen path.

## Deploying the app

1. Build and containerize backend for Cloud Run (from repo root):
   ```
   # Build
   docker build -t us-central1-docker.pkg.dev/<project>/luxe-repo/luxe-api:latest .

   # Authenticate and push
   gcloud auth configure-docker us-central1-docker.pkg.dev
   docker push us-central1-docker.pkg.dev/<project>/luxe-repo/luxe-api:latest
   ```
   Then set `cloud_run_image` to this image and `terraform apply`.

2. Build frontend and upload to bucket:
   ```
   npm ci
   npm run build:client   # outputs to dist/client
   gsutil -m rsync -r ./dist/client gs://<bucket_name>
   ```

3. Set frontend `.env` at build time for API base URL (optional):
   - If using dedicated API domain: `VITE_API_BASE_URL=https://api.malafaareh.com`
   - If using same origin with path-based routing (advanced LB): leave empty and ensure `/api/*` proxies to API

## Cloud Run Job (Admin reset)
- When `enable_cloud_sql=true` the config provisions `google_cloud_run_v2_job.reset_admin` for on-demand admin password rotation.
- Execute with: `gcloud run jobs execute <service-name>-reset-admin --region=<region>`
- Job inherits the same Secret Manager values as the API and mounts the Cloud SQL socket automatically.

## Monitoring & Budgets
- `monitoring.tf` adds a Cloud Monitoring uptime check hitting `https://api.<domain>/health` every few minutes.
- `logging.tf` trims `_Default` log retention (`log_retention_days`) and adds a log-based metric `db-connection-failures` for alerting.
- `billing.tf` optionally creates a budget when `billing_account_id` is set. Thresholds default to 50/80/100% but can be overridden.

## Cloud Build trigger
- `ci_cd.tf` wires a GitHub push trigger to `cloudbuild.yaml` with Kaniko caching and optional static uploads.
- Set `deploy_static_from_ci=true` to automatically sync `dist/client` to the CDN bucket on every build.
- The pipeline deploys Cloud Run with 1 vCPU, 512 MiB RAM, concurrency 80, and min/max instances (0/5) to respect the cost target.

## Notes
- The app seeds an admin user at startup if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.
- Cookies are secure and tied to `COOKIE_DOMAIN`; ensure HTTPS and correct domain.
- For Cloud SQL, add a Postgres instance and wire the app using a connection string or the Cloud SQL connector. Migrate services off JSON to SQL with parameterized queries and a schema (Prisma or pg).
