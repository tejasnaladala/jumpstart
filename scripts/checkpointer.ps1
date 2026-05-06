# checkpointer.ps1 — periodic git checkpoint logger. Every 5 minutes,
# checks for any uncommitted changes in tracked safe-zones (harness/,
# scripts/, evals/, docs/, src/lib/) and commits them as a checkpoint.
# Frontend paths (src/app/, src/components/) are intentionally NOT
# touched here — those are user-controlled per the no-frontend-changes
# rule.
#
# Output:
#   experiments/checkpoint.jsonl  one row per checkpoint pass
#
# Each commit message is auto-generated from the diff stats. Multiple
# small commits beat one big drift — easier to revert if a bad fix
# slipped through review.

$ErrorActionPreference = "Continue"
$repoRoot = Split-Path -Parent $PSScriptRoot
$logFile = Join-Path $repoRoot "experiments\checkpoint.jsonl"
$logDir = Split-Path $logFile
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Log-Event {
    param($event, $detail = $null)
    $row = @{
        ts = (Get-Date -Format 'o')
        event = $event
    }
    if ($detail) { $row.detail = $detail }
    ($row | ConvertTo-Json -Compress) | Out-File -FilePath $logFile -Append -Encoding utf8
}

# Safe paths the checkpointer is allowed to commit.
$safePaths = @("harness/", "scripts/", "evals/", "docs/", "src/lib/", ".octogent/")

Log-Event -event "started"

Set-Location $repoRoot

while ($true) {
    try {
        # Get the list of changed files limited to safe paths.
        $statusRaw = git status --porcelain 2>$null
        $changedSafe = @()
        foreach ($line in $statusRaw) {
            if ($line.Length -lt 4) { continue }
            $path = $line.Substring(3).Trim()
            foreach ($safe in $safePaths) {
                if ($path.StartsWith($safe)) {
                    $changedSafe += $path
                    break
                }
            }
        }

        if ($changedSafe.Count -gt 0) {
            $files = $changedSafe -join " "
            $count = $changedSafe.Count
            git add -- $changedSafe 2>$null | Out-Null
            $msg = "checkpoint: autonomous loop touched $count file(s) in safe zones`n`nFiles: $($changedSafe -join ', ')"
            git commit -m $msg 2>$null | Out-Null
            $sha = git rev-parse --short HEAD 2>$null
            Log-Event -event "committed" -detail @{ files = $changedSafe; count = $count; sha = $sha }
        }
        else {
            Log-Event -event "no_changes"
        }
    }
    catch {
        Log-Event -event "error" -detail @{ error = $_.Exception.Message }
    }

    # 5 minute interval.
    Start-Sleep -Seconds 300
}
