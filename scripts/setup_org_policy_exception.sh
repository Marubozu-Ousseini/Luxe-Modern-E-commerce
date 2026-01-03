#!/usr/bin/env bash
set -euo pipefail

# Option A: Project-level exception for Domain Restricted Sharing
# This prepares and applies a project-scoped exception to allow adding
# the Firebase Hosting system account as an IAM policy member.
# Requires org-level permission to set organization policies.
# Usage: ./scripts/setup_org_policy_exception.sh <PROJECT_ID>

PROJECT_ID="${1:-}"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "Usage: $0 <PROJECT_ID>" >&2
  exit 1
fi

# Get project number
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
if [[ -z "${PROJECT_NUMBER}" ]]; then
  echo "Error: unable to resolve project number for ${PROJECT_ID}" >&2
  exit 1
fi

POLICY_FILE="infra/gcp/policies/iam.allowedPolicyMemberDomains.yaml"
mkdir -p "infra/gcp/policies"

cat > "${POLICY_FILE}" << 'YAML'
name: projects/PROJECT_NUMBER/policies/iam.allowedPolicyMemberDomains
spec:
  rules:
  - enforce: false
YAML

# Substitute the project number
sed -i '' "s/PROJECT_NUMBER/${PROJECT_NUMBER}/g" "${POLICY_FILE}"

echo "Prepared policy file at ${POLICY_FILE}:"
cat "${POLICY_FILE}"

echo "Applying org policy exception (requires org admin permissions)..."
gcloud org-policies set-policy "${POLICY_FILE}"

echo "Done. You can now grant invoker:"
echo "  gcloud run services add-iam-policy-binding apiproxy --region us-central1 --member serviceAccount:firebase-hosting@system.gserviceaccount.com --role roles/run.invoker"