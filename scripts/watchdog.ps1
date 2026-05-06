# watchdog.ps1 — supervises the autonomous Jumpstart processes and
# restarts anything that dies. Logs every state change to a checkpoint
# JSONL file so the founder can replay what happened across restarts.
#
# Watches:
#   1. Next.js server on :3030 (next start)
#   2. Harness loop (bun run harness:loop)
#   3. Caffeinate process
#   4. Autonomous coordinator (when wired)
#
# Each process has a "command" + "match pattern" + a "started_at"
# checkpoint. The watchdog re-runs the command when the matching
# process is missing. Tick interval: 30 seconds.

$ErrorActionPreference = "Continue"
$repoRoot = Split-Path -Parent $PSScriptRoot
$logFile = Join-Path $repoRoot "experiments\watchdog.jsonl"
$logDir = Split-Path $logFile
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Log-Event {
    param($name, $event, $detail = $null)
    $row = @{
        ts = (Get-Date -Format 'o')
        name = $name
        event = $event
    }
    if ($detail) { $row.detail = $detail }
    ($row | ConvertTo-Json -Compress) | Out-File -FilePath $logFile -Append -Encoding utf8
}

# Process descriptors. Each one says how to detect "alive" via TCP
# port (preferred) or process-line match, plus how to start it back up.
$processes = @(
    @{
        name = "server"
        # Detect via TCP listening on 3030
        check = { Test-NetConnection -ComputerName 127.0.0.1 -Port 3030 -InformationLevel Quiet -WarningAction SilentlyContinue }
        start = {
            $env:JUMPSTART_PRIVATE_BETA = "1"
            $env:JUMPSTART_ALLOW_STUB = "1"
            $env:JUMPSTART_DEV_ADMIN = "1"
            $env:JUMPSTART_FORCE_STUBS = "1"
            Start-Process -FilePath "bun" -ArgumentList "run","start" -WorkingDirectory $repoRoot -WindowStyle Hidden -PassThru
        }
    },
    @{
        name = "harness_loop"
        # Detect by checking harness-loop.log mtime within last 4 minutes.
        # Loop pause is 3 min, so anything older than 4 min means it died.
        check = {
            $logPath = Join-Path $repoRoot "experiments\harness-loop.log"
            if (-not (Test-Path $logPath)) { return $false }
            $ageMin = ((Get-Date) - (Get-Item $logPath).LastWriteTime).TotalMinutes
            return $ageMin -lt 4
        }
        start = {
            $env:HARNESS_CONCURRENCY = "3"
            $env:HARNESS_REALISM = "0.4"
            $env:HARNESS_LOOP_PAUSE_MS = "180000"
            Start-Process -FilePath "bun" -ArgumentList "run","harness:loop" -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $repoRoot "experiments\harness-loop.log") -PassThru
        }
    },
    @{
        name = "caffeinate"
        # Detect via marker file mtime within last 90s.
        check = {
            $logPath = Join-Path $repoRoot "experiments\caffeinate.log"
            if (-not (Test-Path $logPath)) { return $false }
            $ageSec = ((Get-Date) - (Get-Item $logPath).LastWriteTime).TotalSeconds
            return $ageSec -lt 90
        }
        start = {
            Start-Process powershell.exe -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File',(Join-Path $repoRoot "scripts\caffeinate.ps1") -PassThru
        }
    },
    @{
        name = "autonomous_coordinator"
        # Detect via checkpoint file mtime within last 5 min.
        check = {
            $cpPath = Join-Path $repoRoot "experiments\coordinator.jsonl"
            if (-not (Test-Path $cpPath)) { return $false }
            $ageMin = ((Get-Date) - (Get-Item $cpPath).LastWriteTime).TotalMinutes
            return $ageMin -lt 5
        }
        start = {
            $env:HARNESS_BASE_URL = "http://localhost:3030"
            Start-Process -FilePath "bun" -ArgumentList "run","coord:loop" -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $repoRoot "experiments\coordinator.log") -PassThru
        }
    }
)

Log-Event -name "watchdog" -event "started"

while ($true) {
    # Heartbeat so verify-stack.sh can detect watchdog liveness via log
    # mtime. Without a heartbeat the watchdog only writes when something
    # changes, and the cron flags us as stale during quiet windows.
    Log-Event -name "watchdog" -event "tick"
    foreach ($p in $processes) {
        try {
            $alive = & $p.check
            if (-not $alive) {
                Log-Event -name $p.name -event "missing"
                try {
                    $proc = & $p.start
                    Log-Event -name $p.name -event "restarted" -detail @{ pid = if ($proc) { $proc.Id } else { $null } }
                }
                catch {
                    Log-Event -name $p.name -event "start_error" -detail @{ error = $_.Exception.Message }
                }
            }
        }
        catch {
            Log-Event -name $p.name -event "check_error" -detail @{ error = $_.Exception.Message }
        }
    }
    Start-Sleep -Seconds 30
}
