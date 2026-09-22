#!/usr/bin/env bash
# Manage the Telegram webhook without ever printing the bot token.
# Usage: bun run telegram:webhook:set | telegram:webhook:info | telegram:webhook:delete
set -euo pipefail

cd "$(dirname "$0")/.."
set -a; source supabase/functions/.env; set +a

PROJECT_REF=$(cat supabase/.temp/project-ref)
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/telegram-bot"
API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}"

case "${1:-}" in
  set)
    curl -sS "$API/setWebhook" \
      -d url="$WEBHOOK_URL" \
      -d secret_token="$TELEGRAM_WEBHOOK_SECRET" \
      -d 'allowed_updates=["message","callback_query"]' \
      -d drop_pending_updates=true
    ;;
  info)   curl -sS "$API/getWebhookInfo" ;;
  delete) curl -sS "$API/deleteWebhook" ;;
  *) echo "Usage: $0 set|info|delete" >&2; exit 1 ;;
esac
echo
