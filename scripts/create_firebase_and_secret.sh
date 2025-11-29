#!/usr/bin/env bash
# Usage: ./create_firebase_and_secret.sh PROJECT_ID SERVICE_ACCOUNT_NAME SECRET_NAME [PROJECT_DISPLAY_NAME] [BILLING_ACCOUNT]
# Example: ./create_firebase_and_secret.sh my-firebase-project my-firebase-sa firebase-admin-key "My Firebase Project" 000000-000000-000000

set -euo pipefail

PROJECT_ID=${1:-}
SA_NAME=${2:-firebase-admin-sa}
SECRET_NAME=${3:-firebase-admin-key}
PROJECT_DISPLAY_NAME=${4:-${PROJECT_ID}}
BILLING_ACCOUNT=${5:-}

if [[ -z "$PROJECT_ID" ]]; then
  echo "Error: PROJECT_ID is required.\nUsage: $0 PROJECT_ID [SERVICE_ACCOUNT_NAME] [SECRET_NAME] [PROJECT_DISPLAY_NAME] [BILLING_ACCOUNT]"
  exit 2
fi

echo "Ensure you are authenticated with gcloud and have the necessary permissions."
echo "If you need to login now, run: gcloud auth login"

command -v gcloud >/dev/null 2>&1 || { echo "gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"; exit 1; }
command -v firebase >/dev/null 2>&1 || echo "Warning: firebase CLI not found. You can still create the project with gcloud, but enabling Firebase features may require the firebase CLI."

echo "Creating or selecting project: $PROJECT_ID"
if gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Project $PROJECT_ID already exists — skipping creation."
else
  gcloud projects create "$PROJECT_ID" --name="$PROJECT_DISPLAY_NAME"
  echo "Created project $PROJECT_ID"
fi

if [[ -n "$BILLING_ACCOUNT" ]]; then
  echo "Linking billing account $BILLING_ACCOUNT to project $PROJECT_ID"
  gcloud beta billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
fi

echo "Setting active project to $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "Enabling required APIs..."
gcloud services enable firebase.googleapis.com iam.googleapis.com secretmanager.googleapis.com cloudresourcemanager.googleapis.com --project="$PROJECT_ID"

if command -v firebase >/dev/null 2>&1; then
  # Try to add Firebase to the project; firebase CLI requires authentication too
  if ! firebase projects:list --json 2>/dev/null | grep -q "\"projectId\": \"$PROJECT_ID\""; then
    echo "Adding Firebase to project (may require interactive login)..."
    firebase projects:addfirebase "$PROJECT_ID" || echo "firebase CLI addfirebase failed or requires manual console step. You can enable Firebase in the console: https://console.firebase.google.com/"
  else
    echo "Firebase already added to project $PROJECT_ID"
  fi
else
  echo "firebase CLI not installed; skipping firebase-specific setup. You can enable Firebase from the console: https://console.firebase.google.com/"
fi

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Creating service account: $SA_EMAIL"
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "Service account already exists — skipping creation."
else
  gcloud iam service-accounts create "$SA_NAME" --display-name="Firebase admin service account" --project="$PROJECT_ID"
fi

echo "Granting minimal roles to service account (firebase admin and secret manager admin). Review and adjust as needed."
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA_EMAIL" --role="roles/firebase.admin"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA_EMAIL" --role="roles/secretmanager.admin"

KEY_FILE="/tmp/${PROJECT_ID}_${SA_NAME}_key.json"
echo "Creating service account key (temporary file: $KEY_FILE)"
gcloud iam service-accounts keys create "$KEY_FILE" --iam-account="$SA_EMAIL" --project="$PROJECT_ID"

echo "Creating Secret Manager secret: $SECRET_NAME"
if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo "Secret $SECRET_NAME already exists — adding a new version."
  gcloud secrets versions add "$SECRET_NAME" --data-file="$KEY_FILE" --project="$PROJECT_ID"
else
  gcloud secrets create "$SECRET_NAME" --replication-policy="automatic" --project="$PROJECT_ID"
  gcloud secrets versions add "$SECRET_NAME" --data-file="$KEY_FILE" --project="$PROJECT_ID"
fi

echo "Cleaning up local key file"
shred -u "$KEY_FILE" 2>/dev/null || rm -f "$KEY_FILE"

echo "DONE. The service account key was stored in Secret Manager as secret: $SECRET_NAME"
echo "Next steps:"
echo "- In Cloud Run, add the Secret as an environment variable or mount it using Secret Manager. Example env var name: FIREBASE_ADMIN_KEY_SECRET=$SECRET_NAME"
echo "- In your Cloud Run service, grant the Cloud Run runtime service account access to Secret Manager:"
echo "    gcloud secrets add-iam-policy-binding $SECRET_NAME --member=serviceAccount:$(gcloud run services describe YOUR_SERVICE --platform=managed --format='value(spec.template.spec.serviceAccountName)') --role=roles/secretmanager.secretAccessor --project=$PROJECT_ID"
echo "- For Google Sign-In (OAuth) enablement, open the Firebase console > Authentication > Sign-in method and enable Google provider."

exit 0
