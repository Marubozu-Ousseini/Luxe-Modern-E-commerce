# Firebase Hosting Deployment (SPA)

This repo includes a minimal Firebase Hosting setup to serve the built SPA from `dist/client`.

## Prereqs
- Firebase CLI installed: `npm i -g firebase-tools`
- Logged in: `firebase login`
- Firebase project exists (default set to `malafaareh-481713` in `.firebaserc`).
  - If you prefer using the GCP project `malafaareh-481713`, run `firebase use malafaareh-481713` and ensure Firebase is enabled for that project.

## Build
```bash
npm ci
npm run build:client
```

## Deploy
```bash
firebase use malafaareh-481713   # or your chosen Firebase project
firebase deploy --only hosting
```

## Custom Domains (DNS)
- Add `malafaareh.com` and `www.malafaareh.com` in Firebase console under Hosting → Custom domains.
- Follow the provided DNS records (Squarespace) until both show "Connected".
- Keep `api.malafaareh.com` pointing to Cloud Run managed domain (already verified).

## Notes
- All routes rewrite to `/index.html` (SPA).
- Static asset caching set for common extensions.
- API calls will be cross-origin to `https://api.malafaareh.com` (CORS is already allowed in the server).

## Hosting → Cloud Functions v2 (Cloud Run) IAM

- Hosting rewrites to Functions 2nd gen use a Cloud Run service (e.g., `apiproxy`). If the service is private, Hosting must be permitted to invoke it.
- Grant `roles/run.invoker` on the Cloud Run service to `serviceAccount:firebase-hosting@system.gserviceaccount.com`.
- If your org enforces Domain Restricted Sharing, this binding can be blocked. In that case, request an exception from an org admin or temporarily allow unauthenticated access.

### Grant invoker (preferred)

Run the helper script:

```bash
./scripts/grant_hosting_invoker.sh apiproxy us-central1
```

If this fails with `FAILED_PRECONDITION` due to org policy, involve an org admin to permit the Hosting service account principal for IAM bindings in this project.

### Temporary workaround (if policy allows)

```bash
gcloud run services add-iam-policy-binding apiproxy \
  --region us-central1 \
  --member allUsers \
  --role roles/run.invoker
```

Note: This is often blocked by org policy. Prefer the Hosting service account binding.

### Verify

```bash
gcloud run services get-iam-policy apiproxy --region us-central1
```

Ensure `roles/run.invoker` includes `serviceAccount:firebase-hosting@system.gserviceaccount.com`. Then re-run the staging auth flow script to confirm `/api/auth/sync` works.

### Option A — Project-level exception (Domain Restricted Sharing)

If your organization enforces `constraints/iam.allowedPolicyMemberDomains`, add a project-scoped exception, then grant invoker:

1) Prepare and apply the policy (requires org admin):

```bash
./scripts/setup_org_policy_exception.sh malafaareh-481713
```

This generates and applies [infra/gcp/policies/iam.allowedPolicyMemberDomains.yaml](infra/gcp/policies/iam.allowedPolicyMemberDomains.yaml) with `enforce: false` for this project.

2) Grant Hosting invoker:

```bash
gcloud run services add-iam-policy-binding apiproxy \
  --region us-central1 \
  --member serviceAccount:firebase-hosting@system.gserviceaccount.com \
  --role roles/run.invoker
```

3) Verify and test:

```bash
gcloud run services get-iam-policy apiproxy --region us-central1
npm run ts-node -- scripts/staging_auth_flow.ts https://malafaareh-481713.web.app
```
