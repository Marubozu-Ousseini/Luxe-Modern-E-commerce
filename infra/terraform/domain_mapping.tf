resource "google_cloud_run_domain_mapping" "api_domain" {
  count    = var.enable_cloud_run_domain_mapping ? 1 : 0
  location = var.region
  name     = var.api_subdomain

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.api.name
  }
}

output "api_domain_records" {
  value = try(google_cloud_run_domain_mapping.api_domain[0].status[0].resource_records, [])
}

# Map www to Cloud Run (serves client via Express static)
resource "google_cloud_run_domain_mapping" "www_domain" {
  count    = var.enable_cloud_run_domain_mapping ? 1 : 0
  location = var.region
  name     = "www.${var.domain}"

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.api.name
  }
}

output "www_domain_records" {
  value = try(google_cloud_run_domain_mapping.www_domain[0].status[0].resource_records, [])
}

# Map apex domain to Cloud Run (requires A/AAAA at DNS)
resource "google_cloud_run_domain_mapping" "apex_domain" {
  count    = var.enable_cloud_run_domain_mapping ? 1 : 0
  location = var.region
  name     = var.domain

  metadata {
    namespace = var.project_id
  }

  spec {
    certificate_mode = "AUTOMATIC"
    route_name       = google_cloud_run_v2_service.api.name
  }
}

output "apex_domain_records" {
  value = try(google_cloud_run_domain_mapping.apex_domain[0].status[0].resource_records, [])
}