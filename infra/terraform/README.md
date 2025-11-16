# Terraform - GCP Infrastructure (Free Tier Friendly)

This Terraform config provisions:
- Cloud Run service for the API (public, with JWT and admin password from Secret Manager)
- Cloud Storage bucket for static frontend (SPA)
- HTTPS Global Load Balancer + Cloud CDN in front of the bucket
- Managed SSL certificate for `<domain>` and `www.<domain>`

Optional (manual/next step):
- Domain mapping for Cloud Run at `api.<domain>` or via separate HTTPS Load Balancer path routing.
- Cloud SQL Postgres (Phase 2 when the app migrates from JSON store to Postgres)

## Prerequisites
- A GCP project with billing enabled
- `gcloud` authenticated (`gcloud auth application-default login`)
- Terraform >= 1.5
- Enable APIs (Terraform can enable implicitly when creating resources, but you may pre-enable):
  - run.googleapis.com, compute.googleapis.com, secretmanager.googleapis.com, storage.googleapis.com

## Variables
Create a `terraform.tfvars` with:

```
project_id      = "<your-gcp-project-id>"
region          = "us-central1"
domain          = "malafaareh.com"
api_subdomain   = "api.malafaareh.com"
bucket_name     = "malafaareh-static-<random>"
cloud_run_image = "us-central1-docker.pkg.dev/<project>/luxe-repo/luxe-api:latest"
jwt_secret      = "<strong-random>"
admin_email     = "admin@malafaareh.com"
admin_password  = "<initial-strong-password>"
allowed_origins = "https://www.malafaareh.com,https://malafaareh.com"
cookie_domain   = ".malafaareh.com"
```

## Apply

```
terraform init
terraform plan
terraform apply
```

Outputs:
- `cloud_run_url`: Temporary URL for API
- `lb_ip_address`: Point your DNS A records for apex and www here
- `static_bucket`: Upload frontend assets here

## DNS
- Create A records for `malafaareh.com` and `www.malafaareh.com` to `lb_ip_address`.
- For the API, you can either:
  1) Use the Cloud Run default URL (quick), or
  2) Map `api.malafaareh.com` to Cloud Run (domain mapping). Terraform for domain mapping can be added if desired.

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
   npm run build:client
   gsutil -m rsync -r ./dist gs://<bucket_name>
   ```

3. Set frontend `.env` at build time for API base URL (optional):
   - If using dedicated API domain: `VITE_API_BASE_URL=https://api.malafaareh.com`
   - If using same origin with path-based routing (advanced LB): leave empty and ensure `/api/*` proxies to API

## Notes
- The app seeds an admin user at startup if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set.
- Cookies are secure and tied to `COOKIE_DOMAIN`; ensure HTTPS and correct domain.
- For Cloud SQL, add a Postgres instance and wire the app using a connection string or the Cloud SQL connector. Migrate services off JSON to SQL with parameterized queries and a schema (Prisma or pg).
