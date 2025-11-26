#!/usr/bin/env bash
# Simple functional verification script for local backend (docker-compose)
# Usage: ./scripts/verify-cart-flow.sh
set -euo pipefail

BASE_URL="http://localhost:8080"
TMP_COOKIE="/tmp/verify_cart_cookie.txt"

echo "Starting cart flow verification against $BASE_URL"

TS=$(date +%s)
EMAIL="ci_verify_${TS}@example.com"
PASSWORD="TestPass123"

echo "1) Registering user: $EMAIL"
curl -sS -c "$TMP_COOKIE" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" -d "{\"name\":\"Verify User\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.'

echo "2) Merge client cart as authenticated user"
curl -sS -b "$TMP_COOKIE" -X POST "$BASE_URL/api/cart/merge" -H "Content-Type: application/json" -d '{"cart":[{"productId":1,"qty":2}]}' -w "\nHTTP_CODE:%{http_code}\n"

echo "3) Create order from server-side cart"
curl -sS -b "$TMP_COOKIE" -X POST "$BASE_URL/api/orders" -H "Content-Type: application/json" -d '{"items":[{"productId":1,"quantity":2}],"paymentMethod":"on_delivery"}' -w "\nHTTP_CODE:%{http_code}\n" | jq -r '.' || true

echo "Verification completed. Cookie stored at $TMP_COOKIE"
