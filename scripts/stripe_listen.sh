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

if ! command -v stripe >/dev/null 2>&1; then
  echo "Stripe CLI not found in PATH. Install it first." >&2
  exit 1
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "STRIPE_SECRET_KEY is required (.env.local or env)." >&2
  exit 1
fi

API_PORT="${PRINTIFY_SERVER_PORT:-3031}"
FORWARD_TO="${1:-${STRIPE_WEBHOOK_FORWARD_TO:-http://localhost:${API_PORT}/api/stripe/webhook}}"
EVENTS="${STRIPE_LISTEN_EVENTS:-payment_intent.succeeded,payment_intent.processing,payment_intent.payment_failed,checkout.session.completed,checkout.session.async_payment_succeeded,invoice.paid,invoice.payment_failed,customer.subscription.updated,customer.subscription.deleted}"

echo "Forwarding Stripe events to: ${FORWARD_TO}"
echo "Listening for: ${EVENTS}"

exec stripe listen \
  --api-key "$STRIPE_SECRET_KEY" \
  --events "$EVENTS" \
  --forward-to "$FORWARD_TO"
