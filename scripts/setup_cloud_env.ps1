# Interactive helper to set .cloud-env without typing secrets into chat or git
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "   TiDB Cloud Connection Setup & Import Helper    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$hostName = "gateway01.ap-northeast-1.prod.aws.tidbcloud.com"
$port = "4000"
$user = "kATmXHBV7UPMHc6.root"

Write-Host "`nCluster Host : $hostName"
Write-Host "Cluster Port : $port"
Write-Host "Cluster User : $user`n"

$pass = Read-Host "Paste your TiDB Cloud Password (input will be hidden)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass)
$plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

$envContent = @"
CLOUD_DB_HOST=$hostName
CLOUD_DB_PORT=$port
CLOUD_DB_USER=$user
CLOUD_DB_PASSWORD=$plainPass
"@

Set-Content -Path ".cloud-env" -Value $envContent -Encoding utf8
Write-Host "`n✓ .cloud-env created securely (file is git-ignored)." -ForegroundColor Green
 Write-Host "Running TiDB verification and import script..."
Write-Host ""

node scripts/verify_and_import_tidb.js
