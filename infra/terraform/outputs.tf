output "cloud_run_url" {
  description = "Deployed Cloud Run URL"
  value       = google_cloud_run_v2_service.api.uri
}

output "lb_ip_address" {
  description = "Global IP address for HTTPS Load Balancer; point your A records (apex and www) here"
  value       = google_compute_global_address.lb_ip.address
}

output "static_bucket" {
  description = "Static website bucket name"
  value       = google_storage_bucket.static.name
}
