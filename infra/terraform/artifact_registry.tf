resource "google_artifact_registry_repository" "cloud_run" {
  project       = var.project_id
  location      = var.region
  repository_id = var.artifact_repo_id
  description   = "Container images built via Cloud Build for the API"
  format        = "DOCKER"
}

resource "google_artifact_registry_repository_iam_member" "cloud_run_pull" {
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.cloud_run.repository_id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:service-${var.project_number}@serverless-robot-prod.iam.gserviceaccount.com"
}
