# =====================================================
# CONFIGURATION INITIALE DE VOTRE ENVIRONNEMENT
# =====================================================
# Script interactif pour configurer vos paramètres

# Charger la configuration
. .\scripts\config.ps1

Write-Host "🚀 CONFIGURATION DE VOTRE ENVIRONNEMENT DE CLONAGE" -ForegroundColor Green
Write-Host "=================================================="
Write-Host ""

# Vérifier les prérequis
if (!(Test-Prerequisites)) {
    Write-Host "❌ Prérequis manquants. Installez PostgreSQL client d'abord." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 CONFIGURATION INTERACTIVE" -ForegroundColor Cyan
Write-Host "============================="

# Configuration PROD
Write-Host ""
Write-Host "🏢 ENVIRONNEMENT PRODUCTION:" -ForegroundColor Yellow
$ProdHost = Read-Host "Host PROD (actuel: $($Global:ProdConfig.Host))"
if ($ProdHost) { $Global:ProdConfig.Host = $ProdHost }

$ProdDB = Read-Host "Base de données PROD (actuel: $($Global:ProdConfig.Database))"
if ($ProdDB) { $Global:ProdConfig.Database = $ProdDB }

$ProdUser = Read-Host "Utilisateur PROD (actuel: $($Global:ProdConfig.User))"
if ($ProdUser) { $Global:ProdConfig.User = $ProdUser }

# Configuration TEST
Write-Host ""
Write-Host "🧪 ENVIRONNEMENT TEST:" -ForegroundColor Yellow
$TestHost = Read-Host "Host TEST (actuel: $($Global:TestConfig.Host))"
if ($TestHost) { $Global:TestConfig.Host = $TestHost }

$TestDB = Read-Host "Base de données TEST (actuel: $($Global:TestConfig.Database))"
if ($TestDB) { $Global:TestConfig.Database = $TestDB }

$TestUser = Read-Host "Utilisateur TEST (actuel: $($Global:TestConfig.User))"
if ($TestUser) { $Global:TestConfig.User = $TestUser }

# Configuration DEV
Write-Host ""
Write-Host "🔧 ENVIRONNEMENT DEV:" -ForegroundColor Yellow
$DevHost = Read-Host "Host DEV (actuel: $($Global:DevConfig.Host))"
if ($DevHost) { $Global:DevConfig.Host = $DevHost }

$DevDB = Read-Host "Base de données DEV (actuel: $($Global:DevConfig.Database))"
if ($DevDB) { $Global:DevConfig.Database = $DevDB }

$DevUser = Read-Host "Utilisateur DEV (actuel: $($Global:DevConfig.User))"
if ($DevUser) { $Global:DevConfig.User = $DevUser }

# Sauvegarder la configuration
Write-Host ""
Write-Host "💾 SAUVEGARDE DE LA CONFIGURATION..." -ForegroundColor Yellow

$ConfigContent = @"
# Configuration générée automatiquement le $(Get-Date)

`$Global:ProdConfig = @{
    Host = "$($Global:ProdConfig.Host)"
    Database = "$($Global:ProdConfig.Database)"
    User = "$($Global:ProdConfig.User)"
    Port = "$($Global:ProdConfig.Port)"
}

`$Global:TestConfig = @{
    Host = "$($Global:TestConfig.Host)"
    Database = "$($Global:TestConfig.Database)"
    User = "$($Global:TestConfig.User)"
    Port = "$($Global:TestConfig.Port)"
}

`$Global:DevConfig = @{
    Host = "$($Global:DevConfig.Host)"
    Database = "$($Global:DevConfig.Database)"
    User = "$($Global:DevConfig.User)"
    Port = "$($Global:DevConfig.Port)"
}

`$Global:Paths = @{
    BackupDir = "$($Global:Paths.BackupDir)"
    ScriptsDir = "$($Global:Paths.ScriptsDir)"
    LogsDir = "$($Global:Paths.LogsDir)"
}

`$Global:ExcludedTables = @(
    "auth.users",
    "auth.sessions", 
    "auth.refresh_tokens",
    "profiles",
    "user_sessions",
    "notifications",
    "messages"
)
"@

$ConfigContent | Out-File -FilePath "scripts\my-config.ps1" -Encoding UTF8

Write-Host "✅ Configuration sauvegardée dans: scripts\my-config.ps1" -ForegroundColor Green

# Test de connexion
Write-Host ""
Write-Host "🔍 TEST DE CONNEXION..." -ForegroundColor Yellow

Write-Host "Test connexion PROD..." -ForegroundColor Cyan
try {
    $TestResult = psql -h $Global:ProdConfig.Host -U $Global:ProdConfig.User -d $Global:ProdConfig.Database -c "SELECT 'Connexion PROD OK' as status;" 2>$null
    if ($TestResult -match "Connexion PROD OK") {
        Write-Host "✅ Connexion PROD réussie" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Connexion PROD à vérifier" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur connexion PROD: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test connexion TEST..." -ForegroundColor Cyan
try {
    $TestResult = psql -h $Global:TestConfig.Host -U $Global:TestConfig.User -d $Global:TestConfig.Database -c "SELECT 'Connexion TEST OK' as status;" 2>$null
    if ($TestResult -match "Connexion TEST OK") {
        Write-Host "✅ Connexion TEST réussie" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Connexion TEST à vérifier" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur connexion TEST: $($_.Exception.Message)" -ForegroundColor Red
}

# Résumé final
Write-Host ""
Write-Host "🎉 CONFIGURATION TERMINÉE!" -ForegroundColor Green
Write-Host "=========================="
Show-Configuration

Write-Host ""
Write-Host "🚀 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host "1. Testez un clonage: .\scripts\quick-clone.ps1 test"
Write-Host "2. Vérifiez l'environnement: .\scripts\run-analysis.ps1 test"
Write-Host "3. Modifiez scripts\my-config.ps1 si nécessaire"