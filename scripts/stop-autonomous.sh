#!/usr/bin/env bash
# stop-autonomous.sh — kill the full autonomous stack. The watchdog
# is killed first so it doesn't restart anything mid-shutdown. Then
# everything else.

set -uo pipefail
cd "$(dirname "$0")/.."

echo "[stop] killing watchdog first..."
# powershell processes running watchdog.ps1
powershell.exe -NoProfile -Command "Get-Process powershell -ErrorAction SilentlyContinue | Where-Object { \$_.MainWindowTitle -eq '' } | Stop-Process -Force -ErrorAction SilentlyContinue" 2>/dev/null || true
# Also kill any caffeinate / checkpointer
sleep 1

echo "[stop] killing bun processes (server + loops)..."
# Try to kill bun processes by PID match. Be precise: kill only the
# tsx-run scripts, not the daemon.
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name='bun.exe'\" | Where-Object { \$_.CommandLine -match 'next start|harness:loop|coord:loop|research:loop' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" 2>/dev/null || true

echo "[stop] done. Run scripts/launch-autonomous.sh to restart."
