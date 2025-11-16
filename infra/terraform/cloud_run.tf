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
        name = "JWT_SECRET"
        value_source {
        # Cloud SQL connector via Unix socket
        env {
          name  = "PGHOST"
          value = "/cloudsql/${google_sql_database_instance.postgres.connection_name}"
        }
        env {
          name  = "PGUSER"
          value = var.db_user
        }
        env {
          name  = "PGDATABASE"
          value = var.db_name
        }
        env {
          name = "PGPASSWORD"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.db_password.id
              version = "latest"
            }
          }
        }
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.id
            version = "latest"
          }
        }
      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.postgres.connection_name]
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
