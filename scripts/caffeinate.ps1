# caffeinate.ps1 — keep this Windows machine awake while the autonomous
# loop runs. Calls SetThreadExecutionState every 30 seconds to refresh
# the wake state.
#
# Flags:
#   ES_CONTINUOUS         (0x80000000)  apply state until next call
#   ES_SYSTEM_REQUIRED    (0x00000001)  forces the system to be in the
#                                       working state. Stops sleep.
#   ES_AWAYMODE_REQUIRED  (0x00000040)  enables away-mode so the system
#                                       acts like it's awake even when the
#                                       lid is closed.
#
# Use Ctrl-C or kill the process to release. To release safely, the script
# resets to ES_CONTINUOUS only (clears the system-required flag) on exit.

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Power {
    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern uint SetThreadExecutionState(uint esFlags);
}
"@

$ES_CONTINUOUS        = [uint32]"0x80000000"
$ES_SYSTEM_REQUIRED   = [uint32]"0x00000001"
$ES_AWAYMODE_REQUIRED = [uint32]"0x00000040"

$flags = $ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED -bor $ES_AWAYMODE_REQUIRED

# Refresh on a 30-second tick. ES_CONTINUOUS technically holds it
# indefinitely, but a periodic refresh covers a class of edge cases
# where Windows clears the state on session change / dock change.
$logFile = Join-Path $PSScriptRoot "..\experiments\caffeinate.log"
$logDir = Split-Path $logFile
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

"$(Get-Date -Format 'o') caffeinate started, flags=$flags" | Out-File -FilePath $logFile -Append -Encoding utf8

try {
    while ($true) {
        $result = [Power]::SetThreadExecutionState($flags)
        if ($result -eq 0) {
            "$(Get-Date -Format 'o') WARN SetThreadExecutionState returned 0 (failed)" | Out-File -FilePath $logFile -Append -Encoding utf8
        }
        Start-Sleep -Seconds 30
    }
}
finally {
    # Release on exit so the system can sleep again normally.
    [Power]::SetThreadExecutionState($ES_CONTINUOUS) | Out-Null
    "$(Get-Date -Format 'o') caffeinate exited" | Out-File -FilePath $logFile -Append -Encoding utf8
}
