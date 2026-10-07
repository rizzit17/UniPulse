param (
    [string]$TargetUrl = "http://localhost:8080"
)

Write-Host "Executing UniPulse k6 Load Test against $TargetUrl..." -ForegroundColor Cyan
k6 run -e TARGET_URL="$TargetUrl" load-tests/k6/mixed-workload.js
