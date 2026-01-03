variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "domain" {
  description = "Primary domain (e.g., malafaareh.com)"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for API (e.g., api.malafaareh.com)"
  type        = string
  default     = "api.malafaareh.com"
}

variable "bucket_name" {
  description = "GCS bucket name for static assets (must be globally unique)"
  type        = string
}

variable "artifact_repo_id" {
  description = "Artifact Registry repository ID for container images"
  type        = string
  default     = "luxe-repo"
}

variable "cloud_run_image" {
  description = "Container image for Cloud Run (Artifact Registry URL)"
  type        = string
}

variable "project_number" {
  description = "Numeric project number used for service account emails"
  type        = string
  default     = ""
}

variable "cloud_run_service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "luxe-modern-ecommerce-api"
}

variable "cloud_run_cpu" {
  description = "vCPU allocation for Cloud Run"
  type        = string
  default     = "1"
}

variable "cloud_run_memory" {
  description = "Memory allocation for Cloud Run"
  type        = string
  default     = "512Mi"
}

variable "cloud_run_concurrency" {
  description = "Max concurrent requests handled per instance"
  type        = number
  default     = 80
}

variable "cloud_run_min_instances" {
  description = "Minimum instances for Cloud Run autoscaling"
  type        = number
  default     = 0
}

variable "cloud_run_max_instances" {
  description = "Maximum instances for Cloud Run autoscaling"
  type        = number
  default     = 5
}

variable "jwt_secret" {
  description = "JWT secret value"
  type        = string
  sensitive   = true
}

variable "admin_email" {
  description = "Admin email address"
  type        = string
  default     = "admin@malafaareh.com"
}

variable "admin_password" {
  description = "Initial admin password"
  type        = string
  sensitive   = true
}

variable "allowed_origins" {
  description = "Comma separated allowed origins"
  type        = string
  default     = "https://www.malafaareh.com,https://malafaareh.com"
}

variable "cookie_domain" {
  description = "Cookie domain (e.g., .malafaareh.com)"
  type        = string
  default     = ".malafaareh.com"
}

variable "db_name" {
  description = "Postgres database name"
  type        = string
  default     = "luxe_db"
}

variable "db_user" {
  description = "Postgres database user"
  type        = string
  default     = "luxe_user"
}

variable "enable_cloud_sql" {
  description = "Set to true to provision Cloud SQL and wire the service to Postgres"
  type        = bool
  default     = false
}

# Firebase client configuration (Web App)
variable "firebase_client_api_key" {
  description = "Firebase Web App API key (client)"
  type        = string
  default     = ""
}

variable "firebase_client_auth_domain" {
  description = "Firebase Web App auth domain (e.g., yourapp.firebaseapp.com)"
  type        = string
  default     = ""
}

variable "firebase_client_project_id" {
  description = "Firebase project ID for client SDK"
  type        = string
  default     = ""
}

variable "firebase_client_app_id" {
  description = "Firebase Web App ID"
  type        = string
  default     = ""
}

variable "firebase_client_storage_bucket" {
  description = "Firebase storage bucket hostname"
  type        = string
  default     = ""
}

variable "firebase_client_messaging_sender_id" {
  description = "Firebase messaging sender ID"
  type        = string
  default     = ""
}

variable "firebase_client_measurement_id" {
  description = "Firebase measurement ID (Analytics)"
  type        = string
  default     = ""
}

# Optional: firebase-admin credentials JSON (string) to inject via Secret Manager
variable "firebase_admin_key_json" {
  description = "JSON string of Firebase admin service account (optional)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_secret_key" {
  description = "Stripe secret API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_currency" {
  description = "Base currency to charge via Stripe (e.g. usd, eur)"
  type        = string
  default     = "usd"
}

variable "enable_cloud_build_trigger" {
  description = "If true, create a Cloud Build trigger for GitHub pushes"
  type        = bool
  default     = true
}

variable "github_owner" {
  description = "GitHub org or user that owns the repo"
  type        = string
  default     = "Marubozu-Ousseini"
}

variable "github_repo" {
  description = "Repository name for CI trigger"
  type        = string
  default     = "Luxe-Modern-E-commerce"
}

variable "github_branch" {
  description = "Branch regex for the Cloud Build trigger"
  type        = string
  default     = "main"
}

variable "deploy_static_from_ci" {
  description = "Toggle static asset sync from Cloud Build"
  type        = bool
  default     = false
}

variable "ci_run_tests" {
  description = "Whether CI should run unit tests"
  type        = bool
  default     = true
}

variable "ci_run_migrations" {
  description = "Whether CI should run DB migrations"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Retention period for the default logging bucket"
  type        = number
  default     = 30
}

variable "enable_reset_admin_job" {
  description = "Create a Cloud Run job to reset admin passwords"
  type        = bool
  default     = true
}

variable "billing_account_id" {
  description = "Billing account ID (format: XXXXXX-XXXXXX-XXXXXX) for budgets"
  type        = string
  default     = ""
}

variable "budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 100
}

variable "budget_notification_thresholds" {
  description = "Budget alert thresholds as decimals (0.5 => 50%)"
  type        = list(number)
  default     = [0.5, 0.8, 1.0]
}

variable "uptime_check_enabled" {
  description = "Create a Cloud Monitoring uptime check for the API"
  type        = bool
  default     = true
}

variable "uptime_check_period_minutes" {
  description = "Minutes between uptime check probes"
  type        = number
  default     = 5
}

variable "enable_cloud_run_domain_mapping" {
  description = "Whether to create Cloud Run domain mappings for apex/www (disable when using HTTPS LB for custom domains)."
  type        = bool
  default     = false
}

variable "public_cloud_run" {
  description = "If true, grant public invoker (allUsers) to Cloud Run service. Leave false when fronted by HTTPS LB."
  type        = bool
  default     = false
}

variable "enable_loadbalancing_api" {
  description = "Attempt to enable loadbalancing.googleapis.com (requires org-level permission). Leave false if you lack permissions."
  type        = bool
  default     = false
}

variable "enable_public_cdn" {
  description = "Grant public read on the static bucket for CDN. Leave false if org policy blocks public access or CDN is not used."
  type        = bool
  default     = false
}
