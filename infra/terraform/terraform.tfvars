# Terraform variables for Luxe-Modern-E-commerce (copy of terraform.tfvars.example)
# FILL IN REAL VALUES BEFORE APPLY
project_id = "malafaareh"
region     = "us-central1"
domain     = "malafaareh.com"
api_subdomain = "api.example.com"
bucket_name = "example-static-bucket-unique"
cloud_run_image = "us-central1-docker.pkg.dev/your-gcp-project-id/your-repo/luxe-api:latest"
jwt_secret = "replace_with_strong_jwt_secret"
admin_email = "admin@example.com"
admin_password = "ChangeMe_Initial_Admin_Password!"
allowed_origins = "https://www.example.com,https://example.com"
cookie_domain = ".example.com"
stripe_secret_key = "sk_test_..."
stripe_webhook_secret = "whsec_..."
stripe_currency = "usd"
# Optional overrides
# db_name = "luxe_db"
# db_user = "luxe_user"
