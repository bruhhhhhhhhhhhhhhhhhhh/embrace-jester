#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

load_env_file() {
  local file_path="$1"
  if [[ -f "$file_path" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$file_path"
    set +a
  fi
}

load_env_file ".env"
load_env_file ".env.local"

for required_bin in curl stripe node; do
  if ! command -v "$required_bin" >/dev/null 2>&1; then
    echo "Missing required command: $required_bin" >&2
    exit 1
  fi
done

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "STRIPE_SECRET_KEY is required (.env.local or env)." >&2
  exit 1
fi

API_BASE="${1:-${STRIPE_API_BASE:-http://localhost:${PRINTIFY_SERVER_PORT:-3031}}}"
RETURN_URL="${STRIPE_TEST_RETURN_URL:-https://example.com}"
TEST_EMAIL="${STRIPE_TEST_EMAIL:-webhook.tester@example.com}"
ORDER_ID="LMX-QA-$(date +%s)"
CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

create_response="$(
  curl -sS -X POST "${API_BASE}/api/stripe/payment-intent" \
    -H "Content-Type: application/json" \
    --data-binary @- <<JSON
{
  "order": {
    "id": "${ORDER_ID}",
    "createdAt": "${CREATED_AT}",
    "items": [
      {
        "id": "698e0a8bdbc6f2ab33061f12",
        "name": "QA Stripe Test Shirt",
        "price": 20.68,
        "image": "https://images-api.printify.com/mockup/698e0a8bdbc6f2ab33061f12/103802/100701/unisex-garment-dyed-pocket-t-shirt.jpg?camera_label=front",
        "quantity": 1,
        "size": "L",
        "color": "Black"
      }
    ],
    "subtotal": 20.68,
    "shippingCost": 8,
    "tax": 1.55,
    "total": 30.23,
    "paymentMethod": "stripe_payment_element",
    "shippingMethod": "standard",
    "contact": {
      "firstName": "Webhook",
      "lastName": "Tester",
      "email": "${TEST_EMAIL}",
      "phone": ""
    },
    "shipping": {
      "address": "123 Test St",
      "city": "New York",
      "region": "NY",
      "postal": "10001",
      "country": "US"
    },
    "estimatedDelivery": "4-6 business days"
  }
}
JSON
)"

payment_intent_id="$(
  node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8");
let obj;
try {
  obj = JSON.parse(raw);
} catch {
  console.error("Unexpected payment-intent response:");
  console.error(raw);
  process.exit(1);
}
if (!obj || typeof obj.paymentIntentId !== "string") {
  console.error("Missing paymentIntentId in response:");
  console.error(raw);
  process.exit(1);
}
process.stdout.write(obj.paymentIntentId);
' <<<"$create_response"
)"

echo "Created order: ${ORDER_ID}"
echo "PaymentIntent: ${payment_intent_id}"

confirm_response="$(
  stripe payment_intents confirm "$payment_intent_id" \
    --payment-method pm_card_visa \
    --return-url "$RETURN_URL" \
    --api-key "$STRIPE_SECRET_KEY"
)"

payment_status="$(
  node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8");
let obj;
try {
  obj = JSON.parse(raw);
} catch {
  console.error("Unexpected confirm response:");
  console.error(raw);
  process.exit(1);
}
if (!obj || typeof obj.status !== "string") {
  console.error("Missing status in confirm response:");
  console.error(raw);
  process.exit(1);
}
process.stdout.write(obj.status);
' <<<"$confirm_response"
)"

echo "Confirmed PaymentIntent status: ${payment_status}"

status_response="$(curl -sS "${API_BASE}/api/stripe/order-status?payment_intent=${payment_intent_id}")"
echo "Order status response:"
echo "$status_response"

if [[ "$payment_status" != "succeeded" && "$payment_status" != "processing" ]]; then
  echo "Expected succeeded/processing, got: ${payment_status}" >&2
  exit 1
fi

echo "Stripe payment-intent test completed."
