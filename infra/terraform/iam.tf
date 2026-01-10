resource "google_project_iam_member" "cloud_build_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
}
# Allow Cloud Run's revision service account (compute default) to access secrets
resource "google_project_iam_member" "secret_accessor_compute" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${var.project_number}-compute@developer.gserviceaccount.com"
}
