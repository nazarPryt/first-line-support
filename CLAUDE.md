# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A first-line customer support backend: a Telegram bot whose users become "clients", with every message (both directions) logged to Supabase Postgres. Everything runs as Supabase Edge Functions (Deno); there is no frontend in this repo yet. Bun is the package manager for the root (only used for the Supabase CLI and scripts).

## Commands

```bash
bun install                              # installs the Supabase CLI locally
bun run supabase <args>                  # Supabase CLI, e.g.:
bun run supabase start                   #   local stack (Docker)
bun run supabase functions serve         #   run edge functions locally with hot reload
bun run supabase db reset                #   re-apply migrations to the local DB
bun run supabase migration new <name>    #   new file in supabase/migrations/
bun run supabase db push                 #   apply migrations to the linked remote project
bun run supabase functions deploy <fn>   #   deploy one function
bun run supabase secrets set --env-file supabase/functions/.env

bun run telegram:webhook:set|info|delete # point Telegram at the deployed telegram-bot function

bun run env:decrypt                      # .env.production.enc -> supabase/functions/.env (needs age key)
bun run env:edit                         # edit encrypted env in place
bun run env:encrypt                      # re-encrypt supabase/functions/.env
```

There are no tests, linter, or build step configured.

## Architecture

- **`supabase/functions/telegram-bot`** — Telegram webhook (grammY). A catch-all `bot.on("message")` middleware runs first: it upserts the sender into `clients` (keyed by `telegram_user_id`), stores `ctx.clientId`, and logs the incoming message before handlers run. All bot replies must go through the local `reply()` helper so they are logged too (`sender = 'bot'`). The top-level `fetch` swallows errors and returns 200 so Telegram doesn't retry crashing updates. Webhook requests are authenticated via `TELEGRAM_WEBHOOK_SECRET` (the `X-Telegram-Bot-Api-Secret-Token` header), not Supabase JWT.
- **`get-clients` / `get-messages`** — read-only JSON endpoints wrapped in `withSupabase({ auth: "secret" })` from `@supabase/server`; callers must send the project's secret key in the `apikey` header.
- All functions have `verify_jwt = false` in `supabase/config.toml` (auth is handled in code as above). Each function has its own `deno.json` import map registered in `config.toml` — add new functions there too.
- **Database** (`supabase/migrations/`): `clients` and `messages` (`sender` enum `client|bot`). A trigger on `messages` insert keeps `clients.last_message_at` current. RLS is enabled with **no policies** on purpose: only Edge Functions using the secret key (`SUPABASE_SECRET_KEYS` JSON, `"default"` entry) can read/write.

## Secrets

- `supabase/functions/.env` (gitignored) holds `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`; see `.env.example`.
- The committed copy is `supabase/functions/.env.production.enc`, encrypted with sops + age (`.sops.yaml`).
- `scripts/webhook.sh` reads the project ref from `supabase/.temp/project-ref`, so the CLI must be linked (`supabase link`) first. It deliberately never echoes the bot token.
