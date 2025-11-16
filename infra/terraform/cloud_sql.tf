resource "google_sql_database_instance" "postgres" {
  name             = "luxe-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"

    ip_configuration {
      ipv4_enabled = false
      private_network = null
    }
  }
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "google_sql_user" "db_user" {
  instance = google_sql_database_instance.postgres.name
  name     = var.db_user
  password = random_password.db_password.result
}

resource "google_sql_database" "db" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
}

# Secret for DB password
resource "google_secret_manager_secret" "db_password" {
  secret_id  = "db-password"
  replication { auto {} }
}

resource "google_secret_manager_secret_version" "db_password_v" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}
