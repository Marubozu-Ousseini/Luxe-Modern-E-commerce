locals {
  cloud_sql_provisioned = var.enable_cloud_sql
}

resource "google_sql_database_instance" "postgres" {
  count               = local.cloud_sql_provisioned ? 1 : 0
  name                = "luxe-postgres"
  database_version    = "POSTGRES_15"
  region              = var.region
  deletion_protection = false

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled = true
    }
  }
}

resource "random_password" "db_password" {
  count   = local.cloud_sql_provisioned ? 1 : 0
  length  = 20
  special = true
}

resource "google_sql_user" "db_user" {
  count    = local.cloud_sql_provisioned ? 1 : 0
  instance = google_sql_database_instance.postgres[0].name
  name     = var.db_user
  password = random_password.db_password[0].result
}

# Allow IAM auth for the Cloud Run service account (assumes default compute service account)
resource "google_project_iam_member" "cloudsql_instance_user" {
  count   = local.cloud_sql_provisioned ? 1 : 0
  project = var.project_id
  role    = "roles/cloudsql.instanceUser"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}

resource "google_sql_database" "db" {
  count    = local.cloud_sql_provisioned ? 1 : 0
  name     = var.db_name
  instance = google_sql_database_instance.postgres[0].name
}

# Secret for DB password (used by migrations/local dev)
resource "google_secret_manager_secret" "db_password" {
  count     = local.cloud_sql_provisioned ? 1 : 0
  secret_id = "db-password"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password_v" {
  count       = local.cloud_sql_provisioned ? 1 : 0
  secret      = google_secret_manager_secret.db_password[0].id
  secret_data = random_password.db_password[0].result
}
