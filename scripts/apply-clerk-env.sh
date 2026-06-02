#!/usr/bin/env bash
# Apply Clerk API keys to .env.local (Clerk MCP cannot fetch keys — paste from dashboard).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.local"

publishable="${1:-}"
secret="${2:-}"

if [[ -z "$publishable" || -z "$secret" ]]; then
  echo "Usage: ./scripts/apply-clerk-env.sh <NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY> <CLERK_SECRET_KEY>"
  echo "Get keys: https://dashboard.clerk.com → your app → Configure → API Keys"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT/.env.example" "$ENV_FILE"
fi

update_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

update_var "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "$publishable"
update_var "CLERK_SECRET_KEY" "$secret"

echo "Updated $ENV_FILE with Clerk keys."
echo "Restart dev server: npm run dev"
