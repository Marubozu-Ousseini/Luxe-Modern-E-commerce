locals {
  domain_slug = replace(var.domain, ".", "-")
}

# Static site bucket
resource "google_storage_bucket" "static" {
  name                        = var.bucket_name
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }
  cors {
    origin          = ["https://www.${var.domain}", "https://${var.domain}"]
    method          = ["GET", "HEAD"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Backend bucket for CDN
resource "google_compute_backend_bucket" "cdn_backend" {
  name        = "cdn-backend-${var.bucket_name}"
  bucket_name = google_storage_bucket.static.name
  enable_cdn  = true
}

# Public read access for static site objects
resource "google_storage_bucket_iam_binding" "static_public_read" {
  count  = var.enable_public_cdn ? 1 : 0
  bucket = google_storage_bucket.static.name
  role   = "roles/storage.objectViewer"
  members = [
    "allUsers",
  ]
}

# Global IP for HTTPS load balancer
resource "google_compute_global_address" "lb_ip" {
  name = "lb-ip-${local.domain_slug}"
}

# Managed SSL certificates
# Existing individual certs for www and apex remain to avoid disruption
resource "google_compute_managed_ssl_certificate" "cert_www" {
  name = "cert-www-${local.domain_slug}"
  managed {
    domains = ["www.${var.domain}"]
  }
}

resource "google_compute_managed_ssl_certificate" "cert_apex" {
  name = "cert-apex-${local.domain_slug}"
  managed {
    domains = [var.domain]
  }
}

# New combined certificate covering both apex and www to ensure correct SNI selection
resource "google_compute_managed_ssl_certificate" "cert_combo" {
  name = "cert-combo-${local.domain_slug}"
  managed {
    domains = [var.domain, "www.${var.domain}"]
  }
}

# URL map pointing to backend bucket by default
resource "google_compute_url_map" "https_map" {
  name            = "https-map-${local.domain_slug}"
  default_service = google_compute_backend_bucket.cdn_backend.id
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name    = "https-proxy-${local.domain_slug}"
  url_map = google_compute_url_map.https_map.id
  ssl_certificates = [
    # Attach all certs for robust SNI handling
    google_compute_managed_ssl_certificate.cert_combo.id,
    google_compute_managed_ssl_certificate.cert_apex.id,
    google_compute_managed_ssl_certificate.cert_www.id,
  ]
}

resource "google_compute_global_forwarding_rule" "https_rule" {
  name                  = "https-forwarding-${local.domain_slug}"
  target                = google_compute_target_https_proxy.https_proxy.id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL"
  ip_address            = google_compute_global_address.lb_ip.address
}

# Optional HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name = "http-redirect-${local.domain_slug}"
  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "http-proxy-${local.domain_slug}"
  url_map = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http_rule" {
  name                  = "http-forwarding-${local.domain_slug}"
  target                = google_compute_target_http_proxy.http_proxy.id
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL"
  ip_address            = google_compute_global_address.lb_ip.address
}
