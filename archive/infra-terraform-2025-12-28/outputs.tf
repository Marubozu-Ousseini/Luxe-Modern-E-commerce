output "cloud_run_url" {
  description = "Deployed Cloud Run URL"
  value       = google_cloud_run_v2_service.api.uri
}

output "lb_ip_run" {
  description = "Global IP address for Cloud Run HTTPS Load Balancer"
  value       = google_compute_global_address.lb_ip_run.address
}

output "lb_ip_static" {
  description = "Global IP address for Static CDN HTTPS Load Balancer"
  value       = google_compute_global_address.lb_ip.address
}

output "static_bucket" {
  description = "Static website bucket name"
  value       = google_storage_bucket.static.name
}
