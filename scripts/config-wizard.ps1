# Configuration simple
Write-Host "Configuration de votre environnement de clonage" -ForegroundColor Green
Write-Host "==============================================="

# Verification des outils
if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "ERREUR: psql non trouve. Installez PostgreSQL client." -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL client trouve!" -ForegroundColor Green

# Creation des dossiers
$folders = @("backups", "logs")
foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "Dossier $folder cree" -ForegroundColor Green
    }
}

# Configuration interactive
Write-Host ""
Write-Host "ENVIRONNEMENT PRODUCTION:" -ForegroundColor Yellow
$ProdHost = Read-Host "Host PROD (defaut: localhost)"
if (!$ProdHost) { $ProdHost = "localhost" }

$ProdDB = Read-Host "Base PROD (defaut: loft_prod)"
if (!$ProdDB) { $ProdDB = "loft_prod" }

$ProdUser = Read-Host "Utilisateur PROD (defaut: postgres)"
if (!$ProdUser) { $ProdUser = "postgres" }

Write-Host ""
Write-Host "ENVIRONNEMENT TEST:" -ForegroundColor Yellow
$TestHost = Read-Host "Host TEST (defaut: localhost)"
if (!$TestHost) { $TestHost = "localhost" }

$TestDB = Read-Host "Base TEST (defaut: loft_test)"
if (!$TestDB) { $TestDB = "loft_test" }

$TestUser = Read-Host "Utilisateur TEST (defaut: postgres)"
if (!$TestUser) { $TestUser = "postgres" }

# Sauvegarde
$ConfigContent = @"
# Configuration generee le $(Get-Date)
function Get-EnvConfig {
    param([string]`$Environment)
    switch (`$Environment.ToLower()) {
        "prod" { 
            return @{
                Host = "$ProdHost"
                Database = "$ProdDB"
                User = "$ProdUser"
                Port = "5432"
            }
        }
        "test" { 
            return @{
                Host = "$TestHost"
                Database = "$TestDB"
                User = "$TestUser"
                Port = "5432"
            }
        }
    }
}
"@

$ConfigContent | Out-File -FilePath "scripts\my-config.ps1" -Encoding UTF8

Write-Host ""
Write-Host "Configuration sauvegardee!" -ForegroundColor Green
Write-Host "PROD: $ProdHost/$ProdDB"
Write-Host "TEST: $TestHost/$TestDB"
Write-Host ""
Write-Host "Prochaines etapes:"
Write-Host "1. .\scripts\quick-clone.ps1 test"
Write-Host "2. .\scripts\run-analysis.ps1 test"