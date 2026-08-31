# PocketBase setup

Replaces the Supabase wiring for closed-beta-of-10 to ~500 users.
Single Go binary, SQLite-backed, includes auth + realtime + admin UI +
file storage out of the box. Cheaper to run than Supabase, easier to
host on a single VPS.

## First run

```bash
bash scripts/start-pocketbase.sh
```

That:

1. Downloads the pinned PocketBase archive and the release's official `checksums.txt`.
2. Verifies the archive with SHA-256 before extracting the executable into `pocketbase/bin/`.
3. Starts the server on `http://127.0.0.1:8090`.
4. Exposes the admin UI at `http://127.0.0.1:8090/_/`.

Open the admin UI on first run, create your admin account, then import
the collection schema:

```
Settings -> Import collections -> paste pocketbase/schema.json
```

The schema covers six collections: `users` (auth), `founder_cards`,
`drops`, `threads`, `posts`, `moderation`. They mirror the localStorage
shapes the app currently uses, so the migration is mostly client-side
swap-in.

## Wire the app to PocketBase

In `.env.local`:

```
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

Rebuild and restart the app. `src/lib/pocketbase/client.ts` becomes
active; storage helpers in `src/lib/inbox/threads.ts`,
`src/lib/forum/posts.ts`, and `src/lib/drop/eligibility.ts` will
gradually swap from `localStorage` to PocketBase calls. The migration
is incremental, so stub mode keeps working as a fallback during the
transition.

## Why PocketBase, not Supabase

- **One binary, no Postgres process.** Easier to host on a $5/month
  VPS or a single droplet.
- **Built-in admin UI.** No need to spin up Drizzle Studio or a custom
  admin surface. The founder uses the PocketBase admin to manually
  approve verifications during the first ~50 users.
- **Realtime subscriptions.** Drop deliveries and inbox messages can
  push updates without polling, with one line of client code.
- **Schema migrations are JSON.** Source-controlled, reviewable in
  PRs, and importable via the admin UI.
- **OAuth providers.** GitHub, Google, Apple, Twitter, and a dozen
  more, configured in the admin UI without writing client glue.

The trade-off is scale: PocketBase's SQLite storage is comfortable
through ~500 concurrent users and a few hundred GB of data. Past that,
migrate to Postgres (Supabase, Neon, or self-hosted). The schema
shapes are designed to translate cleanly.

## Stop

`Ctrl-C` in the terminal where `start-pocketbase.sh` is running.
Data persists in `pocketbase/pb_data/` and survives restarts.

## Production deploy notes

- Loopback is the default. Setting `POCKETBASE_BIND=0.0.0.0:8090` is an explicit external-exposure decision.
- Run behind a reverse proxy (Caddy or nginx) for TLS.
- Put `pocketbase/pb_data/` on a persistent volume.
- Set `--encryptionEnv POCKETBASE_ENCRYPTION_KEY` for at-rest
  encryption of sensitive fields.
- Schedule daily SQLite backups via a cron job; PocketBase has a
  `backups` command built in.
- The admin UI requires a separate admin credential from end-user
  auth. Do not share.
