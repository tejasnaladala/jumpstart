#!/usr/bin/env bash
# Downloads a pinned PocketBase release, verifies its published checksum,
# and starts it on a loopback interface by default.

set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  cat <<'HELP'
start-pocketbase.sh - verify and start the pinned PocketBase sidecar

What it does:
  1. Downloads the PocketBase archive and official checksums.txt from the
     matching GitHub release on first run.
  2. Verifies the archive with SHA-256 before extracting any executable.
  3. Serves the admin UI at http://127.0.0.1:8090/_/ by default.

Configuration:
  POCKETBASE_VERSION=0.22.20       Select a release version.
  POCKETBASE_BIND=127.0.0.1:8090  Select the HTTP bind address.

An external bind such as 0.0.0.0:8090 must be set explicitly. Put any
external deployment behind TLS and an appropriate network boundary.

To migrate the app from localStorage to PocketBase, set
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090 in .env.local and rebuild.
The client remains dormant while that variable is unset.

Stop with Ctrl-C in this terminal.
HELP
  exit 0
fi

PB_VERSION="${POCKETBASE_VERSION:-0.22.20}"
PB_BIND="${POCKETBASE_BIND:-127.0.0.1:8090}"
PB_DIR="pocketbase/bin"
PB_BIN="$PB_DIR/pocketbase"
PB_DATA="pocketbase/pb_data"
PB_VERSION_FILE="$PB_DIR/.version"

mkdir -p "$PB_DIR" "$PB_DATA"

existing_binary=""
if [ -x "$PB_BIN" ]; then
  existing_binary="$PB_BIN"
elif [ -x "${PB_BIN}.exe" ]; then
  existing_binary="${PB_BIN}.exe"
fi

if [ -n "$existing_binary" ]; then
  installed_version="$(cat "$PB_VERSION_FILE" 2>/dev/null || true)"
  if [ "$installed_version" != "$PB_VERSION" ]; then
    echo "[pb] refusing unverified or mismatched binary at $existing_binary" >&2
    echo "[pb] remove pocketbase/bin and rerun to install verified v$PB_VERSION" >&2
    exit 1
  fi
else
  echo "[pb] PocketBase binary missing. Downloading v$PB_VERSION..."
  uname_s="$(uname -s)"
  uname_m="$(uname -m)"
  case "$uname_s" in
    Linux*) PB_OS="linux" ;;
    Darwin*) PB_OS="darwin" ;;
    MINGW*|MSYS*|CYGWIN*) PB_OS="windows" ;;
    *) echo "[pb] unsupported OS: $uname_s" >&2; exit 1 ;;
  esac
  case "$uname_m" in
    x86_64|amd64) PB_ARCH="amd64" ;;
    aarch64|arm64) PB_ARCH="arm64" ;;
    *) echo "[pb] unsupported arch: $uname_m" >&2; exit 1 ;;
  esac

  archive="pocketbase_${PB_VERSION}_${PB_OS}_${PB_ARCH}.zip"
  release_base="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}"
  tmp="$(mktemp -d)"
  cleanup() {
    rm -rf "$tmp"
  }
  trap cleanup EXIT INT TERM

  echo "[pb] fetching $release_base/$archive"
  curl --fail --location --silent --show-error --proto '=https' --tlsv1.2 \
    --retry 3 --output "$tmp/$archive" "$release_base/$archive"
  curl --fail --location --silent --show-error --proto '=https' --tlsv1.2 \
    --retry 3 --output "$tmp/checksums.txt" "$release_base/checksums.txt"

  expected_line="$(awk -v archive="$archive" '$2 == archive { print; found=1 } END { exit !found }' "$tmp/checksums.txt")" || {
    echo "[pb] release checksums do not contain $archive" >&2
    exit 1
  }

  echo "[pb] verifying SHA-256 checksum"
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$tmp" && printf '%s\n' "$expected_line" | sha256sum --check --status -)
  elif command -v shasum >/dev/null 2>&1; then
    (cd "$tmp" && printf '%s\n' "$expected_line" | shasum -a 256 --check --status -)
  else
    echo "[pb] sha256sum or shasum is required to verify the download" >&2
    exit 1
  fi

  unzip -q "$tmp/$archive" -d "$tmp"
  if [ "$PB_OS" = "windows" ]; then
    mv "$tmp/pocketbase.exe" "${PB_BIN}.exe"
    existing_binary="${PB_BIN}.exe"
  else
    mv "$tmp/pocketbase" "$PB_BIN"
    chmod +x "$PB_BIN"
    existing_binary="$PB_BIN"
  fi
  printf '%s\n' "$PB_VERSION" > "$PB_VERSION_FILE"

  cleanup
  trap - EXIT INT TERM
  echo "[pb] installed verified v$PB_VERSION at $existing_binary"
fi

echo "[pb] starting on http://$PB_BIND"
echo "[pb] admin UI: http://$PB_BIND/_/"
echo "[pb] data dir: $PB_DATA"
echo "[pb] schema: pocketbase/schema.json (apply via the admin UI on first run)"

exec "$existing_binary" serve --dir "$PB_DATA" --http "$PB_BIND"
