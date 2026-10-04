# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A first-line customer support backend: a Telegram bot whose users become "clients", with every message (both directions) logged to Supabase Postgres. The backend runs as Supabase Edge Functions (Deno); `web/` is the operator CRM (Vite + React + TypeScript). Bun is the package manager for both the root (Supabase CLI and scripts) and `web/`.

## Commands

```bash
bun install                              # installs the Supabase CLI locally
bun run supabase <args>                  # Supabase CLI, e.g.:
bun run supabase start                   #   local stack (Docker)
bun run supabase functions serve         #   run edge functions locally with hot reload
bun run supabase db reset                #   re-apply migrations to the local DB
bun run supabase migration new <name>    #   new file in supabase/migrations/
bun run supabase:db:migrate:prod         #   apply migrations to the linked prod project (= supabase db push)
bun run supabase functions deploy <fn>   #   deploy one function
bun run supabase secrets set --env-file supabase/functions/.env

bun run web:dev                          # CRM dev server (cd web && bun install first; needs web/.env.local, see web/.env.example)
bun run web:build                        # typecheck + production build of the CRM
bun run gen:types                        # regenerate web/src/lib/database.types.ts from the linked project

bun run telegram:webhook:set|info|delete # point Telegram at the deployed telegram-bot function

bun run supabase:env:decrypt             # .env.production.enc -> supabase/functions/.env (needs age key)
bun run supabase:env:edit                # edit encrypted env in place
bun run supabase:env:encrypt             # re-encrypt supabase/functions/.env
bun run web:env:decrypt|edit|encrypt     # same for web/.env.production.enc <-> web/.env.local
```

There are no tests. `web/` uses Biome for linting and formatting: `bun run lint` (`biome check`) and `bun run lint:fix` (`biome check --write`); config in `web/biome.json` (2 spaces, single quotes, no semicolons, 120 cols; generated `database.types.ts` is excluded). The system Node is 18, which Vite 8 doesn't support, so the web scripts run Vite under Bun (`bun --bun vite`).

## Architecture

- **`supabase/functions/telegram-bot`** — Telegram webhook (grammY). A catch-all `bot.on("message")` middleware runs first: it upserts the sender into `clients` (keyed by `telegram_user_id`), stores `ctx.clientId`, and logs the incoming message before handlers run. All bot replies must go through the local `reply()` helper so they are logged too (`sender = 'bot'`). The top-level `fetch` swallows errors and returns 200 so Telegram doesn't retry crashing updates. Webhook requests are authenticated via `TELEGRAM_WEBHOOK_SECRET` (the `X-Telegram-Bot-Api-Secret-Token` header), not Supabase JWT.
- **`get-clients` / `get-messages`** — read-only JSON endpoints wrapped in `withSupabase({ auth: "secret" })` from `@supabase/server`; callers must send the project's secret key in the `apikey` header.
- All functions have `verify_jwt = false` in `supabase/config.toml` (auth is handled in code as above). Each function has its own `deno.json` import map registered in `config.toml` — add new functions there too.
- **`web/`** — React CRM. Talks to Supabase directly with the publishable key (`supabase-js`, typed via `database.types.ts`), uses TanStack Query for data and a Realtime `postgres_changes` channel that invalidates queries. Operators sign in with email/password (Supabase Auth; public sign-ups are disabled in `config.toml`).
- **Database** (`supabase/migrations/`): `clients` and `messages` (`sender` enum `client|bot`). A trigger on `messages` insert keeps `clients.last_message_at` current. RLS is on for all tables. Writes go only through Edge Functions using the secret key (`SUPABASE_SECRET_KEYS` JSON, `"default"` entry). Signed-in users listed in `operators` (by `auth.users` id) get read-only `select` on `clients` and `messages`; to add an operator, create the user in the dashboard, then `insert into operators (user_id) values ('<uuid>')`. `clients` and `messages` are in the `supabase_realtime` publication.

## Secrets

- `supabase/functions/.env` (gitignored) holds `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`; see `.env.example`.
- The committed copy is `supabase/functions/.env.production.enc`, encrypted with sops + age (`.sops.yaml`).
- `web/.env.local` (gitignored) holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `web/.env.example`); its committed copy is `web/.env.production.enc`, encrypted the same way. These values end up in the browser bundle anyway, so never put the secret key there.
- `scripts/webhook.sh` reads the project ref from `supabase/.temp/project-ref`, so the CLI must be linked (`supabase link`) first. It deliberately never echoes the bot token.
