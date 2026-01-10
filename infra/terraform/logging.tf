resource "google_logging_project_bucket_config" "default_retention" {
  project        = var.project_id
  location       = "global"
  bucket_id      = "_Default"
  retention_days = var.log_retention_days
}

resource "google_logging_metric" "db_connection_failures" {
  name        = "db-connection-failures"
  description = "Counts Cloud Run errors mentioning database connection failures"
  filter      = <<EOT
resource.type="cloud_run_revision"
severity>=ERROR
("ECONNREFUSED" OR "password authentication failed" OR "no pg_hba.conf entry" OR "Failed to connect to database")
EOT

  metric_descriptor {
    unit         = "1"
    value_type   = "INT64"
    metric_kind  = "DELTA"
    display_name = "DB Connection Failures"
  }
}
