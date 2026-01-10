locals {
  has_billing_account = length(var.billing_account_id) > 0
}

resource "google_billing_budget" "project" {
  count           = local.has_billing_account ? 1 : 0
  billing_account = var.billing_account_id
  display_name    = "${var.project_id}-monthly-budget"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.budget_amount)
    }
  }

  dynamic "threshold_rules" {
    for_each = var.budget_notification_thresholds
    content {
      threshold_percent = threshold_rules.value
    }
  }
}
