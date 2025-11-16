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

# Global IP for HTTPS load balancer
resource "google_compute_global_address" "lb_ip" {
  name = "lb-ip-${var.domain}"
}

# Managed SSL certificate for domain and www subdomain
resource "google_compute_managed_ssl_certificate" "cert" {
  name = "cert-${var.domain}"
  managed {
    domains = [var.domain, "www.${var.domain}"]
  }
}

# URL map pointing to backend bucket by default
resource "google_compute_url_map" "https_map" {
  name            = "https-map-${var.domain}"
  default_service = google_compute_backend_bucket.cdn_backend.id
}

resource "google_compute_target_https_proxy" "https_proxy" {
  name             = "https-proxy-${var.domain}"
  url_map          = google_compute_url_map.https_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.cert.id]
}

resource "google_compute_global_forwarding_rule" "https_rule" {
  name                  = "https-forwarding-${var.domain}"
  target                = google_compute_target_https_proxy.https_proxy.id
  port_range            = "443"
  load_balancing_scheme = "EXTERNAL"
  ip_address            = google_compute_global_address.lb_ip.address
}

# Optional HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name = "http-redirect-${var.domain}"
  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "http_proxy" {
  name    = "http-proxy-${var.domain}"
  url_map = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http_rule" {
  name                  = "http-forwarding-${var.domain}"
  target                = google_compute_target_http_proxy.http_proxy.id
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL"
  ip_address            = google_compute_global_address.lb_ip.address
}
