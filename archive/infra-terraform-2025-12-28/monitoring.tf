locals {
  uptime_period_seconds = max(60, var.uptime_check_period_minutes * 60)
}

resource "google_monitoring_uptime_check_config" "api" {
  count        = var.uptime_check_enabled ? 1 : 0
  display_name = "${var.cloud_run_service_name}-uptime"
  timeout      = "10s"
  period       = "${local.uptime_period_seconds}s"

  selected_regions = ["EUROPE", "USA"]

  http_check {
    path         = "/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id  = var.project_id
      host        = var.api_subdomain
      resource_id = var.api_subdomain
    }
  }
}
