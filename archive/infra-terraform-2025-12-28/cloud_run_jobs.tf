locals {
  job_cloud_sql_enabled = var.enable_reset_admin_job && var.enable_cloud_sql
}

resource "google_cloud_run_v2_job" "reset_admin" {
  count               = local.job_cloud_sql_enabled ? 1 : 0
  name                = "${var.cloud_run_service_name}-reset-admin"
  location            = var.region
  deletion_protection = false

  template {
    task_count  = 1
    parallelism = 1

    template {
      service_account = google_service_account.cloud_run_sa.email
      containers {
        image   = var.cloud_run_image
        command = ["node", "dist/scripts/reset-admin.js"]

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "ADMIN_EMAIL"
          value = var.admin_email
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

        env {
          name  = "PGDATABASE"
          value = var.db_name
        }

        env {
          name  = "PGUSER"
          value = var.db_user
        }

        env {
          name  = "PGHOST"
          value = "/cloudsql/${google_sql_database_instance.postgres[0].connection_name}"
        }

        env {
          name  = "INSTANCE_CONNECTION_NAME"
          value = google_sql_database_instance.postgres[0].connection_name
        }

        env {
          name  = "DB_IAM_AUTH"
          value = "true"
        }

        env {
          name = "PGPASSWORD"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.db_password[0].id
              version = "latest"
            }
          }
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.postgres[0].connection_name]
        }
      }
    }
  }
}
