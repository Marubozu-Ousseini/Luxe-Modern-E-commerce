# Enable/disable traffic splitting (default: false for backward compatibility)
variable "enable_traffic_splitting" {
  description = "Enable traffic splitting for blue-green deployments"
  type        = bool
  default     = false
}

# Traffic percentage to new revision (validated 0-100)
variable "new_revision_traffic_percent" {
  description = "Percentage of traffic to route to the new revision (0-100)"
  type        = number
  default     = 100
  validation {
    condition     = var.new_revision_traffic_percent >= 0 && var.new_revision_traffic_percent <= 100
    error_message = "Traffic percentage must be between 0 and 100."
  }
}

# Tag for revision identification and testing
variable "revision_tag" {
  description = "Tag for the new Cloud Run revision (e.g., 'v2', 'canary')"
  type        = string
  default     = "latest"
}