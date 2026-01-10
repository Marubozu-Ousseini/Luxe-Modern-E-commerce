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

# Blue-Green Deployment Outputs
output "cloud_run_latest_revision" {
  description = "Name of the latest Cloud Run revision"
  value       = google_cloud_run_v2_service.api.latest_ready_revision
}

output "cloud_run_revision_url" {
  description = "Tagged URL for testing specific revisions"
  value       = "https://${var.revision_tag}---${google_cloud_run_v2_service.api.name}-${replace(google_cloud_run_v2_service.api.uri, "https://", "")}"
}

output "cloud_run_traffic_distribution" {
  description = "Current traffic distribution across revisions"
  value       = google_cloud_run_v2_service.api.traffic
}

