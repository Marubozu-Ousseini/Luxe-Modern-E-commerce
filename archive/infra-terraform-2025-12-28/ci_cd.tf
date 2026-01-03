locals {
  deploy_static_flag  = var.deploy_static_from_ci ? "true" : "false"
  run_tests_flag      = var.ci_run_tests ? "true" : "false"
  run_migrations_flag = var.ci_run_migrations ? "true" : "false"
}

resource "google_cloudbuild_trigger" "github" {
  count       = var.enable_cloud_build_trigger ? 1 : 0
  name        = "${var.cloud_run_service_name}-deploy"
  description = "Build + deploy Cloud Run API and static assets"

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = "refs/heads/${var.github_branch}"
    }
  }

  filename = "cloudbuild.yaml"

  substitutions = {
    _REGION         = var.region
    _RUN_REGION     = var.region
    _SERVICE_NAME   = var.cloud_run_service_name
    _PROJECT_ID     = var.project_id
    _REPO           = "luxe-repo"
    _IMAGE_TAG      = "$SHORT_SHA"
    _RUN_TESTS      = local.run_tests_flag
    _RUN_MIGRATIONS = local.run_migrations_flag
    _DEPLOY_STATIC  = local.deploy_static_flag
    _STATIC_BUCKET  = var.bucket_name
  }
}
