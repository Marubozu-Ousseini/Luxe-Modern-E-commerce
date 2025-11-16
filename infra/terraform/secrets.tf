resource "google_secret_manager_secret" "jwt_secret" {
  secret_id  = "jwt-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "jwt_secret_v" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

resource "google_secret_manager_secret" "admin_password" {
  secret_id  = "admin-password"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "admin_password_v" {
  secret      = google_secret_manager_secret.admin_password.id
  secret_data = var.admin_password
}

# Stripe secrets (optional; created if values provided)
resource "google_secret_manager_secret" "stripe_secret_key" {
  count     = length(var.stripe_secret_key) > 0 ? 1 : 0
  secret_id = "stripe-secret-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_secret_key_v" {
  count      = length(var.stripe_secret_key) > 0 ? 1 : 0
  secret     = google_secret_manager_secret.stripe_secret_key[0].id
  secret_data = var.stripe_secret_key
}

resource "google_secret_manager_secret" "stripe_webhook_secret" {
  count     = length(var.stripe_webhook_secret) > 0 ? 1 : 0
  secret_id = "stripe-webhook-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_webhook_secret_v" {
  count      = length(var.stripe_webhook_secret) > 0 ? 1 : 0
  secret     = google_secret_manager_secret.stripe_webhook_secret[0].id
  secret_data = var.stripe_webhook_secret
}
