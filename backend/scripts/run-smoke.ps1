$ErrorActionPreference = "Stop"
$port = 4000
$base = "http://localhost:$port"

# 1) Free the port from any stray 'node' listener left over from prior runs.
$owners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
foreach ($ownerPid in $owners) {
    try {
        $proc = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq "node") {
            Write-Output "Freeing port $port from stray node PID $ownerPid"
            Stop-Process -Id $ownerPid -Force -ErrorAction SilentlyContinue
        }
    } catch {}
}
Start-Sleep -Milliseconds 500

# 2) Start the API server in the background.
$server = Start-Process node -ArgumentList "src/server.js" -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput "scripts/server.out.log" `
    -RedirectStandardError "scripts/server.err.log"

# 3) Wait until /api/health responds (up to ~15s).
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $r = Invoke-WebRequest -Uri "$base/api/health" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
}

if (-not $ready) {
    Write-Output "Server did not become ready."
    Write-Output "----- server.err.log -----"
    if (Test-Path scripts/server.err.log) { Get-Content scripts/server.err.log }
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# 4) Run the smoke test.
node scripts/smoke.js
$code = $LASTEXITCODE

# 5) Stop the server we started.
Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue

Write-Output "----- server.err.log (if any) -----"
if (Test-Path scripts/server.err.log) { Get-Content scripts/server.err.log }

Write-Output "SMOKE_EXIT=$code"
exit $code
