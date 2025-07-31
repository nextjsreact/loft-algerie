# =====================================================
# CLONAGE RAPIDE POUR LE DÉVELOPPEMENT QUOTIDIEN (Windows)
# =====================================================
# Version simplifiée pour usage fréquent sur Windows

param(
    [string]$TargetEnv = "test"
)

Write-Host "⚡ CLONAGE RAPIDE PROD → $($TargetEnv.ToUpper())" -ForegroundColor Green
Write-Host "======================================"

# Vérification des prérequis
if (!(Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pg_dump non trouvé. Installez PostgreSQL client." -ForegroundColor Red
    Write-Host "💡 Téléchargez depuis: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Charger la configuration
if (Test-Path "scripts\my-config.ps1") {
    . .\scripts\my-config.ps1
    $ProdConfig = Get-EnvConfig "prod"
    $TargetConfig = Get-EnvConfig $TargetEnv
} else {
    Write-Host "⚠️ Configuration personnalisée non trouvée. Utilisation des valeurs par défaut." -ForegroundColor Yellow
    Write-Host "💡 Exécutez .\scripts\setup-environment.ps1 pour configurer vos paramètres." -ForegroundColor Yellow
    . .\scripts\config.ps1
    $ProdConfig = $Global:ProdConfig
    $TargetConfig = Get-EnvConfig $TargetEnv
}

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "  Source: $($ProdConfig.Host)/$($ProdConfig.Database)"
Write-Host "  Cible: $($TargetConfig.Host)/$($TargetConfig.Database)"
Write-Host ""

try {
    # Clonage avec le script principal
    & ".\scripts\clone-prod-to-env.ps1" -TargetEnv $TargetEnv -ProdHost $ProdConfig.Host -ProdDB $ProdConfig.Database -TargetHost $TargetConfig.Host -TargetUser $TargetConfig.User

    # Vérification rapide
    Write-Host ""
    Write-Host "🔍 VÉRIFICATION RAPIDE:" -ForegroundColor Yellow
    $QuickCheck = & psql -h $TargetConfig.Host -U $TargetConfig.User -d $TargetConfig.Database -c "SELECT 'Profiles: ' || COUNT(*) FROM profiles UNION ALL SELECT 'Lofts: ' || COUNT(*) FROM lofts UNION ALL SELECT 'Users: ' || COUNT(*) FROM auth.users;"
    
    Write-Host $QuickCheck -ForegroundColor Cyan

    Write-Host ""
    Write-Host "✅ Environnement $($TargetEnv.ToUpper()) prêt!" -ForegroundColor Green
    Write-Host "🔗 Connectez-vous avec admin@test.local / test123" -ForegroundColor Cyan

} catch {
    Write-Host "❌ ERREUR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}