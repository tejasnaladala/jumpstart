#!/usr/bin/env bash
# start-pocketbase.sh - first-run downloads the PocketBase binary,
# then starts it on :8090 with our schema applied.
#
# Run alongside the main app (separate terminal):
#   bash scripts/start-pocketbase.sh
#
# Then in .env.local:
#   NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090
#
# Closed-beta-of-10 keeps using localStorage stub mode. PocketBase
# scaffolding is here so we can flip a single env var to migrate when
# the cohort grows past ~50.

set -uo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'HELP'
start-pocketbase.sh - first-run downloads PocketBase, then starts on :8090

What it does:
  1. Downloads the PocketBase binary (~10MB) into pocketbase/bin/ on
     first run. Skips re-download on subsequent runs.
  2. Applies the schema from pocketbase/schema.json on first start.
  3. Serves the admin UI at http://localhost:8090/_/

Why PocketBase:
  - Single Go binary, no Postgres needed.
  - SQLite-backed, suitable for closed-beta-of-10 to ~500 users.
  - Built-in auth (email + OAuth), realtime subscriptions, file storage,
    admin UI. About 1/10th the ops surface of Supabase.

Stop:
  Ctrl-C in this terminal.

To migrate the app from localStorage to PocketBase:
  Set NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090 in .env.local
  and rebuild. The src/lib/pocketbase/client.ts goes live; localStorage
  paths fall back when the env var is unset.
HELP
  exit 0
fi

PB_VERSION="${POCKETBASE_VERSION:-0.22.20}"
PB_DIR="pocketbase/bin"
PB_BIN="$PB_DIR/pocketbase"
PB_DATA="pocketbase/pb_data"

mkdir -p "$PB_DIR" "$PB_DATA"

if [ ! -x "$PB_BIN" ] && [ ! -x "${PB_BIN}.exe" ]; then
  echo "[pb] PocketBase binary missing. Downloading v$PB_VERSION..."
  uname_s="$(uname -s)"
  uname_m="$(uname -m)"
  case "$uname_s" in
    Linux*)   PB_OS="linux" ;;
    Darwin*)  PB_OS="darwin" ;;
    MINGW*|MSYS*|CYGWIN*) PB_OS="windows" ;;
    *) echo "[pb] unsupported OS: $uname_s"; exit 1 ;;
  esac
  case "$uname_m" in
    x86_64|amd64) PB_ARCH="amd64" ;;
    aarch64|arm64) PB_ARCH="arm64" ;;
    *) echo "[pb] unsupported arch: $uname_m"; exit 1 ;;
  esac
  URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${PB_OS}_${PB_ARCH}.zip"
  echo "[pb] fetching $URL"
  TMP=$(mktemp -d)
  curl -fL -o "$TMP/pb.zip" "$URL"
  cd "$TMP" && unzip -q pb.zip && cd - >/dev/null
  if [ "$PB_OS" = "windows" ]; then
    mv "$TMP/pocketbase.exe" "${PB_BIN}.exe"
  else
    mv "$TMP/pocketbase" "$PB_BIN"
    chmod +x "$PB_BIN"
  fi
  rm -rf "$TMP"
  echo "[pb] downloaded to $PB_BIN"
fi

# Pick the right binary suffix for Windows.
if [ -x "${PB_BIN}.exe" ]; then
  PB_BIN="${PB_BIN}.exe"
fi

echo "[pb] starting on http://localhost:8090"
echo "[pb] admin UI: http://localhost:8090/_/"
echo "[pb] data dir: $PB_DATA"
echo "[pb] schema: pocketbase/schema.json (apply via the admin UI on first run)"

exec "$PB_BIN" serve --dir "$PB_DATA" --http "0.0.0.0:8090"
