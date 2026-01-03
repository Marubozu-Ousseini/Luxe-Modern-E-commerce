#!/usr/bin/env bash
set -euo pipefail

# Grant Firebase Hosting service account Cloud Run invoker on a function (2nd gen) service.
# Usage: ./scripts/grant_hosting_invoker.sh [SERVICE_NAME] [REGION]
# Defaults: SERVICE_NAME=apiproxy, REGION=us-central1
# Requires: gcloud configured to the target project.

SERVICE_NAME="${1:-apiproxy}"
REGION="${2:-us-central1}"

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  echo "Error: gcloud is not configured to a project. Run: gcloud config set project <PROJECT_ID>" >&2
  exit 1
fi

MEMBER="serviceAccount:firebase-hosting@system.gserviceaccount.com"

echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}"
echo "Region : ${REGION}"
echo "Member : ${MEMBER}"

set -x
# Note: This may fail if your org enforces Domain Restricted Sharing.
gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --region "${REGION}" \
  --member "${MEMBER}" \
  --role roles/run.invoker
set +x

echo "Done. If this failed with FAILED_PRECONDITION due to org policy, ask an org admin to allow this principal or permit unauthenticated access (allUsers) temporarily, then re-run."