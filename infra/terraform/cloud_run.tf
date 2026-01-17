resource "google_cloud_run_service" "blue_green" {
  name     = "${var.service_name}"
  location = "${var.region}"

  template {
    spec {
      containers {
        image = "${var.image_url}"
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = var.enable_traffic_splitting ? var.new_revision_traffic_percent : 100
    tag     = var.revision_tag
  }
}