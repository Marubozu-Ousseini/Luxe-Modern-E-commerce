resource "google_service_account_iam_member" "runtime_sa_token_creator_admin" {
  service_account_id = google_service_account.cloud_run_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "user:admin@malafaareh.com"
}

resource "google_service_account_iam_member" "runtime_sa_user_admin" {
  service_account_id = google_service_account.cloud_run_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "user:admin@malafaareh.com"
}

# Allow Cloud Build to impersonate the runtime SA during deployment
resource "google_service_account_iam_member" "runtime_sa_user_cloud_build" {
  service_account_id = google_service_account.cloud_run_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
}

resource "google_service_account_iam_member" "runtime_sa_token_creator_cloud_build" {
  service_account_id = google_service_account.cloud_run_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${var.project_number}@cloudbuild.gserviceaccount.com"
}
resource "google_service_account" "cloud_run_sa" {
  account_id   = "cloud-run-runtime"
  display_name = "Cloud Run runtime service account"
}

# Grant Secret Manager access to the runtime SA
resource "google_project_iam_member" "secret_accessor_cloud_run_sa" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Grant Cloud SQL instance user to the runtime SA
resource "google_project_iam_member" "cloudsql_instance_user_cloud_run_sa" {
  count   = var.enable_cloud_sql ? 1 : 0
  project = var.project_id
  role    = "roles/cloudsql.instanceUser"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}
