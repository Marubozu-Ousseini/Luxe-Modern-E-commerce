#!/usr/bin/env bash
set -euo pipefail

# Grant required roles for GitHub Actions service account to deploy via Firebase CLI.
# Usage: ./scripts/grant_github_actions_roles.sh <PROJECT_ID> <SERVICE_ACCOUNT_EMAIL>
# Example: ./scripts/grant_github_actions_roles.sh malafaareh-481713 deploy-ci@malafaareh-481713.iam.gserviceaccount.com

PROJECT_ID=${1:-}
SA_EMAIL=${2:-}

if [[ -z "$PROJECT_ID" || -z "$SA_EMAIL" ]]; then
  echo "Usage: $0 <PROJECT_ID> <SERVICE_ACCOUNT_EMAIL>" >&2
  exit 1
fi

MEMBER="serviceAccount:${SA_EMAIL}"

ROLES=(
  roles/firebasehosting.admin
  roles/cloudfunctions.admin
  roles/run.admin
  roles/iam.serviceAccountUser
)

for ROLE in "${ROLES[@]}"; do
  echo "Granting ${ROLE} to ${MEMBER} on project ${PROJECT_ID}"
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member "${MEMBER}" \
    --role "${ROLE}" \
    --quiet
done

echo "Done. Ensure your Workload Identity Provider is set and bound with 'roles/iam.workloadIdentityUser' to ${SA_EMAIL}."