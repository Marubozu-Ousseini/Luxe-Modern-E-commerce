# CI Deployment via GitHub Actions (WIF)

This repo includes a workflow to deploy Firebase Hosting and Functions on pushes to `main` using Workload Identity Federation (no service account keys).

## Prerequisites
- GCP project: `malafaareh-481713`
- Service Account for CI, e.g. `deploy-ci@malafaareh-481713.iam.gserviceaccount.com`
- Workload Identity Pool & Provider bound to your GitHub repo (Owner/Repo): `Marubozu-Ousseini/Luxe-Modern-E-commerce`
- Binding: grant `roles/iam.workloadIdentityUser` on the CI service account to the WIF principal.

## Required Roles
Grant the following roles to the CI service account at the project level:
- Firebase Hosting Admin (`roles/firebasehosting.admin`)
- Cloud Functions Admin (`roles/cloudfunctions.admin`)
- Cloud Run Admin (`roles/run.admin`)
- Service Account User (`roles/iam.serviceAccountUser`)

Use the helper script:

```bash
./scripts/grant_github_actions_roles.sh malafaareh-481713 deploy-ci@malafaareh-481713.iam.gserviceaccount.com
```

## GitHub Secrets
Set these secrets on the GitHub repository `Marubozu-Ousseini/Luxe-Modern-E-commerce`:
- `WORKLOAD_IDENTITY_PROVIDER`: The full resource name of your WIF provider (example: `projects/123456789/locations/global/workloadIdentityPools/pool-id/providers/provider-id`).
- `GCP_SERVICE_ACCOUNT_EMAIL`: The CI service account email (example: `deploy-ci@malafaareh-481713.iam.gserviceaccount.com`).
- (Optional) `GCP_PROJECT_ID`: `malafaareh-481713`

Using `gh` CLI:

```bash
# From any machine with access
export REPO="Marubozu-Ousseini/Luxe-Modern-E-commerce"

gh secret set WORKLOAD_IDENTITY_PROVIDER -r "$REPO" --body "projects/123456789/locations/global/workloadIdentityPools/pool-id/providers/provider-id"

gh secret set GCP_SERVICE_ACCOUNT_EMAIL -r "$REPO" --body "deploy-ci@malafaareh-481713.iam.gserviceaccount.com"

gh secret set GCP_PROJECT_ID -r "$REPO" --body "malafaareh-481713"
```

## Workflow
- Workflow file: `.github/workflows/firebase-hosting.yml`
- On push to `main`, it will:
  - Authenticate via WIF
  - Build the client
  - Run `firebase deploy --only hosting,functions --project malafaareh-481713`

## Notes
- Org policies may block invoker grants needed for Functions v2 (Cloud Run) routing from Hosting; coordinate Option A (project-level exception) as documented in `README-Firebase.md`.
- For Functions deploy, ensure your function runtime and regions are supported (this repo uses `nodejs20` and `us-central1`).

---

CI trigger: 2026-01-03
