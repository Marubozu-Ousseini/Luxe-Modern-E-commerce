locals {
  run_domain_slug = replace(var.domain, ".", "-")
}

# Serverless NEG targeting Cloud Run service
resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  name                  = "neg-cloudrun-${local.run_domain_slug}"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = google_cloud_run_v2_service.api.name
  }
}

# Backend service using the serverless NEG
resource "google_compute_backend_service" "run_backend" {
  name                  = "backend-cloudrun-${local.run_domain_slug}"
  load_balancing_scheme = "EXTERNAL"
  protocol              = "HTTP"

  backend {
    group = google_compute_region_network_endpoint_group.cloudrun_neg.id
  }

  # Attach Cloud Armor policy for extra protection (optional)
  security_policy = google_compute_security_policy.cloudrun_default.id
}

# URL map: send all traffic to Cloud Run backend
resource "google_compute_url_map" "run_https_map" {
  name            = "https-map-cloudrun-${local.run_domain_slug}"
  default_service = google_compute_backend_service.run_backend.id
}

# New global IP for this HTTPS LB
resource "google_compute_global_address" "lb_ip_run" {
  name = "lb-ip-cloudrun-${local.run_domain_slug}"
}

# HTTPS proxy with managed certs for apex + www
resource "google_compute_target_https_proxy" "run_https_proxy" {
  name    = "https-proxy-cloudrun-${local.run_domain_slug}"
  url_map = google_compute_url_map.run_https_map.id

  ssl_certificates = [
    # Attach all relevant certs to ensure SNI coverage during cert provisioning/rotation
    google_compute_managed_ssl_certificate.cert_combo.id,
    google_compute_managed_ssl_certificate.cert_apex.id,
    google_compute_managed_ssl_certificate.cert_www.id,
  ]
}

resource "google_compute_global_forwarding_rule" "run_https_rule" {
  name                  = "https-forwarding-cloudrun-${local.run_domain_slug}"
  target                = google_compute_target_https_proxy.run_https_proxy.id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL"
  ip_address            = google_compute_global_address.lb_ip_run.address
}

# Optional HTTP to HTTPS redirect for the Cloud Run LB
resource "google_compute_url_map" "run_http_redirect" {
  name = "http-redirect-cloudrun-${local.run_domain_slug}"
  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "run_http_proxy" {
  name    = "http-proxy-cloudrun-${local.run_domain_slug}"
  url_map = google_compute_url_map.run_http_redirect.id
}

resource "google_compute_global_forwarding_rule" "run_http_rule" {
  name                  = "http-forwarding-cloudrun-${local.run_domain_slug}"
  target                = google_compute_target_http_proxy.run_http_proxy.id
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL"
  ip_address            = google_compute_global_address.lb_ip_run.address
}

# IAM: allow the load balancer to invoke the private Cloud Run service
# This uses the Google-managed L7 LB service account for the project.
data "google_project" "current" {}

resource "google_cloud_run_v2_service_iam_member" "api_invoker_lb_sa" {
  name       = "projects/${var.project_id}/locations/${var.region}/services/${google_cloud_run_v2_service.api.name}"
  role       = "roles/run.invoker"
  # Grant invoker to the Cloud Run serverless robot service account
  # Format: service-<PROJECT_NUMBER>@serverless-robot-prod.iam.gserviceaccount.com
  member     = "serviceAccount:service-${data.google_project.current.number}@serverless-robot-prod.iam.gserviceaccount.com"
}

# Additionally grant invoker to the Google-managed L7 LB service account.
# Format: service-<PROJECT_NUMBER>@gcp-sa-l7lb.iam.gserviceaccount.com
resource "google_cloud_run_v2_service_iam_member" "api_invoker_gcp_sa_l7lb" {
  name   = "projects/${var.project_id}/locations/${var.region}/services/${google_cloud_run_v2_service.api.name}"
  role   = "roles/run.invoker"
  member = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-l7lb.iam.gserviceaccount.com"
}

# Cloud Armor security policy (allow all by default; customize rules as needed)
resource "google_compute_security_policy" "cloudrun_default" {
  name        = "armor-cloudrun-${local.run_domain_slug}"
  description = "Default Cloud Armor policy for Cloud Run LB"

  rule {
    action   = "allow"
    priority = 2147483647
    description = "Default allow"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}
