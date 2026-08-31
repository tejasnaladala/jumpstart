#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SOURCE="$ROOT/scripts/start-pocketbase.sh"
TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

new_fixture() {
  local name="$1"
  FIXTURE="$TMP_ROOT/$name"
  mkdir -p "$FIXTURE/scripts" "$FIXTURE/mock-bin"
  cp "$SOURCE" "$FIXTURE/scripts/start-pocketbase.sh"

  cat > "$FIXTURE/mock-bin/uname" <<'EOF'
#!/usr/bin/env bash
case "${1:-}" in
  -s) printf 'Linux\n' ;;
  -m) printf 'x86_64\n' ;;
  *) exit 2 ;;
esac
EOF

  cat > "$FIXTURE/mock-bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
output=""
url=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o|--output)
      output="$2"
      shift 2
      ;;
    *)
      url="$1"
      shift
      ;;
  esac
done
printf '%s\n' "$url" >> "$MOCK_CURL_LOG"
case "$url" in
  */checksums.txt)
    if [ "${BAD_CHECKSUM:-0}" = "1" ]; then
      hash="ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    else
      hash="$(printf 'verified archive' | /usr/bin/sha256sum | awk '{print $1}')"
    fi
    printf '%s  pocketbase_0.22.20_linux_amd64.zip\n' "$hash" > "$output"
    ;;
  *.zip)
    printf 'verified archive' > "$output"
    ;;
  *)
    exit 3
    ;;
esac
EOF

  cat > "$FIXTURE/mock-bin/unzip" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
destination="."
while [ "$#" -gt 0 ]; do
  case "$1" in
    -d)
      destination="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done
cat > "$destination/pocketbase" <<'BIN'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$MOCK_EXEC_LOG"
BIN
chmod +x "$destination/pocketbase"
EOF

  chmod +x "$FIXTURE/mock-bin/uname" "$FIXTURE/mock-bin/curl" "$FIXTURE/mock-bin/unzip"
}

run_fixture() {
  PATH="$FIXTURE/mock-bin:$PATH" \
    MOCK_CURL_LOG="$FIXTURE/curl.log" \
    MOCK_EXEC_LOG="$FIXTURE/exec.log" \
    bash "$FIXTURE/scripts/start-pocketbase.sh" > "$FIXTURE/output.log" 2>&1
}

new_fixture default
run_fixture
grep -q 'checksums.txt' "$FIXTURE/curl.log"
grep -q -- '--http 127.0.0.1:8090' "$FIXTURE/exec.log"

new_fixture external
POCKETBASE_BIND="0.0.0.0:8090" run_fixture
grep -q -- '--http 0.0.0.0:8090' "$FIXTURE/exec.log"

new_fixture bad-checksum
set +e
BAD_CHECKSUM=1 run_fixture
status=$?
set -e
if [ "$status" -eq 0 ]; then
  echo "expected a checksum mismatch to fail" >&2
  exit 1
fi
if [ -e "$FIXTURE/exec.log" ]; then
  echo "PocketBase executed after a checksum mismatch" >&2
  exit 1
fi

echo "start-pocketbase tests passed"
