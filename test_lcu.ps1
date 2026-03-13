$p = Get-CimInstance Win32_Process -Filter "name='LeagueClientUx.exe'" | Select -First 1 -Expand CommandLine
$tokMatch = [regex]::Match($p, '--remoting-auth-token=([a-zA-Z0-9_-]+)')
$portMatch = [regex]::Match($p, '--app-port=(\d+)')
$tok = $tokMatch.Groups[1].Value
$port = $portMatch.Groups[1].Value
Write-Host "Port: $port"
Write-Host "Token: $tok"
Write-Host "Token length: $($tok.Length)"

# Build auth the same way irelia does: Basic base64(riot:token)
$pair = "riot:" + $tok
$b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$auth = "Basic $b64"
Write-Host "Auth header: $auth"

Add-Type 'using System.Net; using System.Security.Cryptography.X509Certificates; public class TP11 : ICertificatePolicy { public bool CheckValidationResult(ServicePoint s, X509Certificate c, WebRequest r, int p) { return true; } }'
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TP11
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

# Test summoner first (known working)
$url = "https://127.0.0.1:$port/lol-summoner/v1/current-summoner"
Write-Host "`nTest: $url"
try {
    $r = Invoke-WebRequest -Uri $url -Headers @{ "Authorization" = $auth; "Accept" = "application/json" } -UseBasicParsing
    Write-Host "Status: $($r.StatusCode) | $($r.Content.Length) chars"
    Write-Host $r.Content.Substring(0, [Math]::Min(200, $r.Content.Length))
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}

# Mastery
$url2 = "https://127.0.0.1:$port/lol-champion-mastery/v1/local-player/champion-mastery"
Write-Host "`nTest: $url2"
try {
    $r = Invoke-WebRequest -Uri $url2 -Headers @{ "Authorization" = $auth; "Accept" = "application/json" } -UseBasicParsing
    Write-Host "Status: $($r.StatusCode) | $($r.Content.Length) chars"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
