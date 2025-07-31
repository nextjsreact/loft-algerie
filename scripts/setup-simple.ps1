# =====================================================
# CONFIGURATION SIMPLE DE VOTRE ENVIRONNEMENT
# =====================================================

Write-Host "🚀 CONFIGURATION DE VOTRE ENVIRONNEMENT DE CLONAGE" -ForegroundColor Green
Write-Host "=================================================="

# Charger la configuration par défaut
. .\scripts\config.ps1

# Vérifier les prérequis
Write-Host "🔍 VÉRIFICATION DES PRÉREQUIS..." -ForegroundColor Yellow

if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "❌ psql non trouvé. Installez PostgreSQL client." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ psql trouvé" -ForegroundColor Green
}

if (!(Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pg_dump non trouvé. Installez PostgreSQL client." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ pg_dump trouvé" -ForegroundColor Green
}

# Créer les dossiers
$folders = @("backups", "logs")
foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "✅ Dossier $folder créé" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📋 CONFIGURATION INTERACTIVE" -ForegroundColor Cyan
Write-Host "============================="

# Configuration PROD
Write-Host ""
Write-Host "🏢 ENVIRONNEMENT PRODUCTION:" -ForegroundColor Yellow
$ProdHost = Read-Host "Host PROD (défaut: localhost)"
if (!$ProdHost) { $ProdHost = "localhost" }

$ProdDB = Read-Host "Base de données PROD (défaut: loft_prod)"
if (!$ProdDB) { $ProdDB = "loft_prod" }

$ProdUser = Read-Host "Utilisateur PROD (défaut: postgres)"
if (!$ProdUser) { $ProdUser = "postgres" }

# Configuration TEST
Write-Host ""
Write-Host "🧪 ENVIRONNEMENT TEST:" -ForegroundColor Yellow
$TestHost = Read-Host "Host TEST (défaut: localhost)"
if (!$TestHost) { $TestHost = "localhost" }

$TestDB = Read-Host "Base de données TEST (défaut: loft_test)"
if (!$TestDB) { $TestDB = "loft_test" }

$TestUser = Read-Host "Utilisateur TEST (défaut: postgres)"
if (!$TestUser) { $TestUser = "postgres" }

# Sauvegarder la configuration
Write-Host ""
Write-Host "💾 SAUVEGARDE DE LA CONFIGURATION..." -ForegroundColor Yellow

$ConfigContent = @"
# Configuration générée le $(Get-Date)

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
        "dev" { 
            return @{
                Host = "$TestHost"
                Database = "loft_dev"
                User = "$TestUser"
                Port = "5432"
            }
        }
        default { 
            Write-Host "Environnement non reconnu" -ForegroundColor Red
            return `$null
        }
    }
}
"@

$ConfigContent | Out-File -FilePath "scripts\my-config.ps1" -Encoding UTF8

Write-Host "✅ Configuration sauvegardée dans: scripts\my-config.ps1" -ForegroundColor Green

# Afficher la configuration
Write-Host ""
Write-Host "📊 VOTRE CONFIGURATION:" -ForegroundColor Cyan
Write-Host "PROD: $ProdHost/$ProdDB (utilisateur: $ProdUser)"
Write-Host "TEST: $TestHost/$TestDB (utilisateur: $TestUser)"

Write-Host ""
Write-Host "🎉 CONFIGURATION TERMINÉE!" -ForegroundColor Green
Write-Host "=========================="
Write-Host ""
Write-Host "🚀 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host "1. Testez: .\scripts\test-my-setup.ps1"
Write-Host "2. Clonez: .\scripts\quick-clone.ps1 test"
Write-Host "3. Analysez: .\scripts\run-analysis.ps1 test"