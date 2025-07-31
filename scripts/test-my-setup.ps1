# =====================================================
# TEST DE VOTRE CONFIGURATION
# =====================================================
# Script pour tester que tout fonctionne correctement

Write-Host "🧪 TEST DE VOTRE CONFIGURATION" -ForegroundColor Green
Write-Host "==============================="

# Charger la configuration
if (Test-Path "scripts\my-config.ps1") {
    . .\scripts\my-config.ps1
    Write-Host "✅ Configuration personnalisée chargée" -ForegroundColor Green
} else {
    . .\scripts\config.ps1
    Write-Host "⚠️ Configuration par défaut utilisée" -ForegroundColor Yellow
    Write-Host "💡 Exécutez .\scripts\setup-environment.ps1 pour personnaliser" -ForegroundColor Yellow
}

Write-Host ""

# Test 1: Vérifier les outils PostgreSQL
Write-Host "🔧 TEST 1: Outils PostgreSQL" -ForegroundColor Cyan
if (Get-Command psql -ErrorAction SilentlyContinue) {
    $PsqlVersion = & psql --version
    Write-Host "✅ psql trouvé: $PsqlVersion" -ForegroundColor Green
} else {
    Write-Host "❌ psql non trouvé" -ForegroundColor Red
}

if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    $PgDumpVersion = & pg_dump --version
    Write-Host "✅ pg_dump trouvé: $PgDumpVersion" -ForegroundColor Green
} else {
    Write-Host "❌ pg_dump non trouvé" -ForegroundColor Red
}

# Test 2: Vérifier les dossiers
Write-Host ""
Write-Host "📁 TEST 2: Structure des dossiers" -ForegroundColor Cyan
$RequiredFolders = @("scripts", "backups", "logs")
foreach ($folder in $RequiredFolders) {
    if (Test-Path $folder) {
        Write-Host "✅ Dossier $folder existe" -ForegroundColor Green
    } else {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "✅ Dossier $folder créé" -ForegroundColor Green
    }
}

# Test 3: Vérifier les scripts SQL existants
Write-Host ""
Write-Host "📄 TEST 3: Scripts SQL existants" -ForegroundColor Cyan
$RequiredScripts = @(
    "quick-table-counts.sql",
    "verify-tv-columns.sql", 
    "create-test-users.sql",
    "final-verification.sql",
    "simple-data-check.sql"
)

foreach ($script in $RequiredScripts) {
    $scriptPath = "scripts\$script"
    if (Test-Path $scriptPath) {
        Write-Host "✅ $script trouvé" -ForegroundColor Green
    } else {
        Write-Host "❌ $script manquant" -ForegroundColor Red
    }
}

# Test 4: Test de connexion aux bases de données
Write-Host ""
Write-Host "🔌 TEST 4: Connexions aux bases de données" -ForegroundColor Cyan

# Test PROD
try {
    $ProdTest = & psql -h $Global:ProdConfig.Host -U $Global:ProdConfig.User -d $Global:ProdConfig.Database -c "SELECT 'OK' as status;" -t 2>$null
    if ($ProdTest -match "OK") {
        Write-Host "✅ Connexion PROD réussie ($($Global:ProdConfig.Host)/$($Global:ProdConfig.Database))" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Connexion PROD à vérifier" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur connexion PROD: $($_.Exception.Message)" -ForegroundColor Red
}

# Test TEST
try {
    $TestTest = & psql -h $Global:TestConfig.Host -U $Global:TestConfig.User -d $Global:TestConfig.Database -c "SELECT 'OK' as status;" -t 2>$null
    if ($TestTest -match "OK") {
        Write-Host "✅ Connexion TEST réussie ($($Global:TestConfig.Host)/$($Global:TestConfig.Database))" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Connexion TEST à vérifier" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur connexion TEST: $($_.Exception.Message)" -ForegroundColor Red
}

# Test DEV
try {
    $DevTest = & psql -h $Global:DevConfig.Host -U $Global:DevConfig.User -d $Global:DevConfig.Database -c "SELECT 'OK' as status;" -t 2>$null
    if ($DevTest -match "OK") {
        Write-Host "✅ Connexion DEV réussie ($($Global:DevConfig.Host)/$($Global:DevConfig.Database))" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Connexion DEV à vérifier" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erreur connexion DEV: $($_.Exception.Message)" -ForegroundColor Red
}

# Résumé
Write-Host ""
Write-Host "📊 RÉSUMÉ DU TEST" -ForegroundColor Green
Write-Host "=================="
Write-Host "Si tous les tests sont ✅, vous pouvez utiliser:"
Write-Host "• .\scripts\quick-clone.ps1 test    (clonage rapide)"
Write-Host "• .\scripts\run-analysis.ps1 test   (analyse complète)"
Write-Host ""
Write-Host "Si des tests sont ❌, corrigez d'abord les problèmes."