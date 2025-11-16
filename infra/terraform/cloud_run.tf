resource "google_cloud_run_v2_service" "api" {
  name     = "luxe-api"
  location = var.region

  template {
    containers {
      image = var.cloud_run_image

      env { 
        name  = "NODE_ENV" 
        value = "production" 
      }
      env { 
        name  = "PORT" 
        value = "8080" 
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
      env { 
        name  = "PGDATABASE" 
        value = var.db_name 
      }
      env { 
        name  = "PGUSER" 
        value = var.db_user 
      }
      # Socket host for Cloud SQL (password fallback if IAM unavailable)
      env { 
        name  = "PGHOST" 
        value = "/cloudsql/${google_sql_database_instance.postgres.connection_name}" 
      }
      env { 
        name  = "INSTANCE_CONNECTION_NAME" 
        value = google_sql_database_instance.postgres.connection_name 
      }
      env { 
        name  = "DB_IAM_AUTH" 
        value = "true" 
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
      env {
        name = "PGPASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.id
            version = "latest"
          }
        }
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance { instances = [google_sql_database_instance.postgres.connection_name] }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
  }

  ingress = "INGRESS_TRAFFIC_ALL"
}

resource "google_cloud_run_v2_service_iam_member" "api_invoker" {
  project  = google_cloud_run_v2_service.api.project
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
