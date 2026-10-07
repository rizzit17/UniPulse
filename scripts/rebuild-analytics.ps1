# UniPulse Analytics Rebuild from Event Replay Script (PowerShell)
param (
    [string]$AnalyticsUrl = "http://localhost:8083",
    [string]$InternalToken = "unipulse-internal-secret-token-2026"
)

Write-Host "=========================================================="
Write-Host "UniPulse: Triggering Analytics Rebuild & Replay"
Write-Host "Target: $AnalyticsUrl/internal/analytics/rebuild"
Write-Host "=========================================================="

try {
    $headers = @{
        "X-Internal-Token" = $InternalToken
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$AnalyticsUrl/internal/analytics/rebuild" -Method Post -Headers $headers -Body "[]"
    Write-Host "SUCCESS: Analytics aggregates successfully cleared and re-initialized." -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "FAILED: Could not rebuild analytics: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
