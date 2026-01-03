# Migration to a New Google Organization

This guide helps you recreate the environment in a new Google Cloud Organization safely, using Terraform. The recommended approach is to provision a NEW project under the target org rather than moving the existing project (which requires org-level move permissions and may be constrained by policies).

## Prerequisites
- Target Organization: org ID and an optional Folder ID where the new project should live.
- Billing Account: ID that is accessible to the target org and to your user.
- Access: You (or a service account) must have roles to create projects, link billing, create state buckets, and apply Terraform.
- Domain Ownership: The `malafaareh.com` domain should be verified in the target org/account for Cloud Run domain mapping.

## What You Will Need
- NEW_PROJECT_ID (e.g., `luxe-modern-eu-prod`)
- BILLING_ACCOUNT_ID (e.g., `012345-6789AB-CDEF01`)
- ORG_ID (e.g., `123456789012`)
- REGION: `europe-west1`
- STATE_BUCKET_NAME for Terraform state (e.g., `tfstate-luxe-modern-eu-prod`)

## 1) Create the Target Project
Using gcloud (replace placeholders):
```bash
# Set org and billing
gcloud organizations list
#gcloud beta billing accounts list

NEW_PROJECT_ID="<NEW_PROJECT_ID>"
BILLING_ACCOUNT_ID="<BILLING_ACCOUNT_ID>"
ORG_ID="<ORG_ID>"

# Create project under org (optionally specify --folder if needed)
gcloud projects create "$NEW_PROJECT_ID" --organization="$ORG_ID"

gcloud beta billing projects link "$NEW_PROJECT_ID" \
  --billing-account="$BILLING_ACCOUNT_ID"

# Set default project for subsequent commands
gcloud config set project "$NEW_PROJECT_ID"
```

Enable required APIs:
```bash
gcloud services enable run.googleapis.com compute.googleapis.com \
  secretmanager.googleapis.com storage.googleapis.com sqladmin.googleapis.com \
  artifactregistry.googleapis.com monitoring.googleapis.com cloudbuild.googleapis.com
```

## 2) Prepare Terraform Remote State (Recommended)
```bash
REGION="europe-west1"
STATE_BUCKET_NAME="tfstate-<NEW_PROJECT_ID>-luxe"

gsutil mb -p "$NEW_PROJECT_ID" -l "$REGION" gs://"$STATE_BUCKET_NAME"
gsutil versioning set on gs://"$STATE_BUCKET_NAME"

# Copy infra/terraform/backend.tf.example to backend.tf and set bucket name
# Then migrate local state to GCS:
cd infra/terraform
terraform init -migrate-state
```

## 3) Update Terraform Variables
Edit `infra/terraform/terraform.tfvars`:
```
project_id              = "<NEW_PROJECT_ID>"
region                  = "europe-west1"
domain                  = "malafaareh.com"
api_subdomain           = "api.malafaareh.com"
bucket_name             = "<NEW_UNIQUE_BUCKET_NAME>"
artifact_repo_id        = "luxe-repo"
cloud_run_image         = "europe-west1-docker.pkg.dev/<NEW_PROJECT_ID>/luxe-repo/luxe-modern-e-commerce:latest"
cloud_run_service_name  = "luxe-modern-ecommerce-api"
# ... keep existing values or rotate as desired (jwt_secret, admin_password, Stripe secrets, etc.)
```
Rotate/reimport secrets if desired.

## 4) Rebuild and Push Image to New Artifact Registry
```bash
# Create Artifact Registry repo if needed (Terraform can do it)
# Build and push with Cloud Build
PROJECT_ID="<NEW_PROJECT_ID>"
gcloud builds submit --region=europe-west1 \
  --config=cloudbuild.yaml \
  --substitutions=_PROJECT_ID="$PROJECT_ID"
```

## 5) Apply Terraform in the Target Project
```bash
cd infra/terraform
terraform init
terraform plan
terraform apply -auto-approve
```

## 6) Migrate Data
### Cloud SQL (Postgres)
Export from old project and import into new:
```bash
# OLD project
OLD_PROJECT_ID="aerobic-botany-479212-s7"
OLD_INSTANCE="luxe-postgres"
EXPORT_BUCKET="gs://<old-export-bucket>"
EXPORT_URI="$EXPORT_BUCKET/luxe_db_$(date +%Y%m%d).sql.gz"

gcloud config set project "$OLD_PROJECT_ID"
gcloud sql export sql "$OLD_INSTANCE" "$EXPORT_URI" --database=luxe_db --offload

# NEW project
NEW_PROJECT_ID="<NEW_PROJECT_ID>"
NEW_INSTANCE="luxe-postgres"
IMPORT_URI="$EXPORT_URI" # ensure access between buckets or copy to a bucket in new project

gcloud config set project "$NEW_PROJECT_ID"
# If needed, copy dump to a bucket in the new project
# gsutil cp "$EXPORT_URI" gs://<new-import-bucket>/

gcloud sql import sql "$NEW_INSTANCE" "$IMPORT_URI" --database=luxe_db
```

### Static Assets
```bash
# Sync from old bucket to new bucket (or rebuild client and upload)
gsutil -m rsync -r gs://<old-static-bucket> gs://<new-static-bucket>
```

## 7) Domain & DNS
- Recreate Cloud DNS managed zone in NEW project (or keep DNS at registrar/another project).
- Point apex and `www` to the new HTTPS LB IP (Terraform output `lb_ip_address`).
- Verify `malafaareh.com` in the new account (Google Search Console) and create Cloud Run domain mapping:
```bash
gcloud beta run domain-mappings create \
  --service=luxe-modern-ecommerce-api \
  --domain=api.malafaareh.com \
  --region=europe-west1 \
  --project=<NEW_PROJECT_ID>
```
Apply the DNS records that command outputs.

## 8) CI/CD and Secrets
- Update Cloud Build trigger to the new project, or use GitHub Actions to push to Artifact Registry.
- Recreate secrets in Secret Manager (JWT, admin, Stripe) or import them; ensure Terraform matches desired versions.
- Update GitHub repository secrets (if Actions used) with new project IDs and auth.

## 9) Decommission Old Project
- After verification and cutover, disable old endpoints, remove domain mappings, and consider exporting final backups.
- Delete or archive the old project once no longer needed.

## Notes
- Some org policies block service account keys, public invokers, or external members. Adjust IAM accordingly.
- If you prefer to MOVE the existing project into the new org, you need `Project Mover` permissions in both orgs and must satisfy the target org policies. This guide assumes re-provisioning instead.
