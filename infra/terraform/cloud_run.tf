locals {
  cloud_sql_conn    = try(google_sql_database_instance.postgres[0].connection_name, "")
  cloud_sql_enabled = var.enable_cloud_sql && local.cloud_sql_conn != ""
  cloud_sql_host    = local.cloud_sql_enabled ? "/cloudsql/${local.cloud_sql_conn}" : ""
}

resource "google_cloud_run_v2_service" "api" {
  name                = var.cloud_run_service_name
  location            = var.region
  deletion_protection = false

  template {
    timeout                          = "60s"
    max_instance_request_concurrency = var.cloud_run_concurrency
    service_account                  = google_service_account.cloud_run_sa.email

    containers {
      image = var.cloud_run_image
      resources {
        cpu_idle = true
        limits = {
          cpu    = var.cloud_run_cpu
          memory = var.cloud_run_memory
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "ALLOWED_ORIGINS"
        value = var.allowed_origins
      }
      env {
        name  = "COOKIE_DOMAIN"
        value = var.cookie_domain
      }
      env {
        name  = "ADMIN_EMAIL"
        value = var.admin_email
      }
      # Firebase client configuration for frontend to fetch via /api/auth/firebase-config
      dynamic "env" {
        for_each = length(var.firebase_client_api_key) > 0 ? [1] : []
        content {
          name  = "FIREBASE_CLIENT_API_KEY"
          value = var.firebase_client_api_key
        }
      }
      dynamic "env" {
        for_each = length(var.firebase_client_auth_domain) > 0 ? [1] : []
        content {
          name  = "FIREBASE_CLIENT_AUTH_DOMAIN"
          value = var.firebase_client_auth_domain
        }
      }
      dynamic "env" {
        for_each = length(var.firebase_client_project_id) > 0 ? [1] : []
        content {
          name  = "FIREBASE_CLIENT_PROJECT_ID"
          value = var.firebase_client_project_id
        }
      }
      dynamic "env" {
        for_each = length(var.firebase_client_app_id) > 0 ? [1] : []
        content {
          name  = "FIREBASE_CLIENT_APP_ID"
          value = var.firebase_client_app_id
        }
      }
      dynamic "env" {
        for_each = length(var.firebase_client_storage_bucket) > 0 ? [1] : []
        content {
          name  = "FIREBASE_CLIENT_STORAGE_BUCKET"
          value = var.firebase_client_storage_bucket
        }
      }
      dynamic "env" {
        for_each = length(var.firebase_client_messaging_sender_id) > 0 ? [1] : []
        content {
          name  = "FIREBASE_CLIENT_MESSAGING_SENDER_ID"
          value = var.firebase_client_messaging_sender_id
        }
      }
      dynamic "env" {
        for_each = length(var.firebase_client_measurement_id) > 0 ? [1] : []
        content {
          name  = "FIREBASE_CLIENT_MEASUREMENT_ID"
          value = var.firebase_client_measurement_id
        }
      }
      dynamic "env" {
        for_each = local.cloud_sql_enabled ? {
          PGDATABASE               = var.db_name,
          PGUSER                   = var.db_user,
          PGHOST                   = local.cloud_sql_host,
          INSTANCE_CONNECTION_NAME = local.cloud_sql_conn,
          DB_IAM_AUTH              = "true"
        } : {}
        content {
          name  = env.key
          value = env.value
        }
      }
      env {
        name  = "STRIPE_CURRENCY"
        value = var.stripe_currency
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.id
            version = "latest"
          }
        }
      }

      env {
        name = "ADMIN_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.admin_password.id
            version = "latest"
          }
        }
      }

      # Optional: provide firebase-admin credentials via Secret Manager
      dynamic "env" {
        for_each = length(var.firebase_admin_key_json) > 0 ? [1] : []
        content {
          name = "FIREBASE_ADMIN_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.firebase_admin_key[0].id
              version = "latest"
            }
          }
        }
      }

      # Optional Stripe secrets
      dynamic "env" {
        for_each = length(var.stripe_secret_key) > 0 ? [1] : []
        content {
          name = "STRIPE_SECRET_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.stripe_secret_key[0].id
              version = "latest"
            }
          }
        }
      }
      dynamic "env" {
        for_each = length(var.stripe_webhook_secret) > 0 ? [1] : []
        content {
          name = "STRIPE_WEBHOOK_SECRET"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.stripe_webhook_secret[0].id
              version = "latest"
            }
          }
        }
      }

      # Fallback password when IAM auth fails locally or migrations
      dynamic "env" {
        for_each = local.cloud_sql_enabled ? [1] : []
        content {
          name = "PGPASSWORD"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.db_password[0].id
              version = "latest"
            }
          }
        }
      }
      dynamic "volume_mounts" {
        for_each = local.cloud_sql_enabled ? [1] : []
        content {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
    }

    dynamic "volumes" {
      for_each = local.cloud_sql_enabled ? [1] : []
      content {
        name = "cloudsql"
        cloud_sql_instance { instances = [local.cloud_sql_conn] }
      }
    }

    scaling {
      min_instance_count = var.cloud_run_min_instances
      max_instance_count = var.cloud_run_max_instances
    }
  }

  # Traffic splitting configuration for blue-green deployments
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = var.enable_traffic_splitting ? var.new_revision_traffic_percent : 100
    tag     = var.revision_tag
  }

  dynamic "traffic" {
    for_each = var.enable_traffic_splitting && var.new_revision_traffic_percent < 100 ? [1] : []
    content {
      type          = "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION"
      revision      = google_cloud_run_v2_service.api.latest_ready_revision
      percent       = 100 - var.new_revision_traffic_percent
    }
  }

  lifecycle {
    ignore_changes = [
      traffic,  # Allow manual traffic adjustments without Terraform drift
    ]
  }

  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
}

# Grant invoker to the runtime service account for testing via impersonation
resource "google_cloud_run_v2_service_iam_member" "api_invoker_runtime_sa" {
  name   = "projects/${var.project_id}/locations/${var.region}/services/${google_cloud_run_v2_service.api.name}"
  role   = "roles/run.invoker"
  member = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_cloud_run_v2_service_iam_member" "api_invoker" {
  count    = var.public_cloud_run ? 1 : 0
  project  = google_cloud_run_v2_service.api.project
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
