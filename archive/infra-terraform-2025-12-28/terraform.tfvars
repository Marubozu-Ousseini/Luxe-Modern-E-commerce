# Terraform variables for Luxe-Modern-E-commerce (copy of terraform.tfvars.example)
# FILL IN REAL VALUES BEFORE APPLY
project_id                     = "malafaareh-481713"
region                         = "europe-west1"
domain                         = "malafaareh.com"
api_subdomain                  = "api.malafaareh.com"
bucket_name                    = "malafaareh-481713-static"
artifact_repo_id               = "luxe-repo"
cloud_run_image                = "europe-west1-docker.pkg.dev/malafaareh-481713/luxe-repo/luxe-modern-ecommerce-api:latest"
cloud_run_service_name         = "luxe-modern-ecommerce-api"
cloud_run_cpu                  = "1"
cloud_run_memory               = "512Mi"
cloud_run_concurrency          = 80
cloud_run_min_instances        = 0
cloud_run_max_instances        = 5
jwt_secret                     = "kKfM8_R7GEXC_yVdrg0zMXvLEKD_oru1m2wklnxBtuS9bYpUuU38pFw-Kr3iUmW3"
admin_email                    = "admin@malafaareh.com"
admin_password                 = "J@milou1"
allowed_origins                = "https://www.malafaareh.com,https://malafaareh.com"
cookie_domain                  = ".malafaareh.com"
stripe_secret_key              = "sk_test_..."
stripe_webhook_secret          = "whsec_..."
stripe_currency                = "usd"
enable_cloud_sql               = true
enable_cloud_build_trigger     = false
deploy_static_from_ci          = false
ci_run_tests                   = true
ci_run_migrations              = true
github_owner                   = "Marubozu-Ousseini"
github_repo                    = "Luxe-Modern-E-commerce"
github_branch                  = "main"
log_retention_days             = 30
enable_reset_admin_job         = true
billing_account_id             = "01D677-BF9C51-C156FC"
budget_amount                  = 100
budget_notification_thresholds = [0.5, 0.8, 1.0]
uptime_check_enabled           = true
uptime_check_period_minutes    = 5
project_number                 = "94961718864"
# Optional overrides
# db_name = "luxe_db"
# db_user = "luxe_user"

# Firebase client config (fill in when available)
firebase_client_api_key             = "AIzaSyCjQ-tQjcn4CoC0TsLemKyvgnBgdVII4M4"
firebase_client_auth_domain         = "malafaarehfirebase2025.firebaseapp.com"
firebase_client_project_id          = "malafaarehfirebase2025"
firebase_client_app_id              = "1:1001058752558:web:57a8bea152f57fa07aa7bf"
firebase_client_storage_bucket      = "malafaarehfirebase2025.firebasestorage.app"
firebase_client_messaging_sender_id = "1001058752558"
firebase_client_measurement_id      = "G-6ZX6S165PV"

# Optional: firebase-admin service account JSON (string); leave empty to use ADC
firebase_admin_key_json = ""

# Keep Cloud Run private (ingress: internal LB) but allow LB to invoke
# without needing the gcp-sa-l7lb identity (which requires org admin to enable
# the Load Balancing API). This grants unauthenticated invoker while ingress
# restricts access to the LB only.
public_cloud_run = true

# Avoid enabling Load Balancing API from Terraform (no permission)
enable_loadbalancing_api = false

# Do not make the static bucket public (org policy blocks public access)
enable_public_cdn = true

# Disable Cloud Run domain mappings when fronting with HTTPS LB
enable_cloud_run_domain_mapping = false