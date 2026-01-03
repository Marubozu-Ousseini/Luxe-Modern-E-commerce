Migration: users.json -> Firestore
=================================

Purpose
-------

This document explains how to migrate users currently stored in the runtime filesystem (`users.json`) into Firestore, and how to switch the app to Firestore-backed user storage.

Preconditions
-------------
- You have a Firebase service account JSON available and either:
  - set it into `FIREBASE_ADMIN_KEY` env var, or
  - pointed `GOOGLE_APPLICATION_CREDENTIALS` to the JSON file.
- Your `users.json` file exists in the runtime `DATA_DIR` (default: OS temp dir `/tmp/luxe-data`).

Steps
-----

1. Confirm the path to `users.json` (server uses `DATA_DIR` or `os.tmpdir()/luxe-data`):

```bash
# If you used a custom DATA_DIR at runtime, set it here as well
export DATA_DIR=/path/to/data_dir
ls -l $DATA_DIR/users.json
```

2. Run the migration script locally (TypeScript). Options depending on your environment:

```bash
# If you have ts-node installed globally or in the project
ts-node scripts/migrate_users_to_firestore.ts

# Or using node with ts-node/register
node -r ts-node/register scripts/migrate_users_to_firestore.ts

# Or using pnpm dlx tsx if you prefer
pnpm dlx tsx scripts/migrate_users_to_firestore.ts
```

The script is idempotent: it skips users that already exist in Firestore (document id == lowercased email).

3. Verify migration in Firestore console (collection `users`). Check a few users, ensure `passwordHash`, `favorites` and `cart` fields were copied.

4. When satisfied, enable Firestore mode in Cloud Run by setting `USE_FIRESTORE=true` and ensuring your Cloud Run service has access to the `firebase-admin-key` secret:

```bash
gcloud run services update luxe-modern-e-commerce \
  --update-env-vars=USE_FIRESTORE=true \
  --update-secrets=FIREBASE_ADMIN_KEY=firebase-admin-key:latest,ADMIN_PASSWORD=admin-password:latest \
  --region=europe-west1 --project=aerobic-botany-479212-s7
```

Notes & Caveats
----------------
- The migration copies `passwordHash` values; the same password verification logic is used after migration, so existing passwords continue to work.
- Admin account: ensure the admin account is present in Firestore before switching. If you used Secret Manager to set `ADMIN_PASSWORD`, the server creates admin on startup if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. Alternatively, migrate the admin record from `users.json` explicitly.
- Rollback: if anything goes wrong, you can set `USE_FIRESTORE=false` on Cloud Run to revert to filesystem behavior (note that runtime filesystem state in Cloud Run may differ from local `users.json`).

Need help?
-----------
If you want, I can:
- Add a small script that exports Firestore users back to JSON (backup).
- Run the migration locally for you (if you provide guidance on how you run scripts locally), or prepare the exact `gcloud` commands for your environment.
