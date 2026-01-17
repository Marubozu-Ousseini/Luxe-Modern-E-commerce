#!/usr/bin/env bash
set -euo pipefail

# Deploy Hosting + Functions to the default Firebase project.
# Uses .firebaserc for the default project (malafaareh-481713).

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

# Deploy hosting and functions
npx firebase use
npx firebase deploy --only hosting,functions
