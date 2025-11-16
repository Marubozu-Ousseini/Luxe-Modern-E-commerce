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

variable "cloud_run_image" {
  description = "Container image for Cloud Run (Artifact Registry URL)"
  type        = string
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
