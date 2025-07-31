# =====================================================
# SCRIPT D'ANALYSE WINDOWS (utilise nos scripts existants)
# =====================================================
# Utilise tous les scripts SQL qu'on a créés ensemble

param(
    [string]$Environment = "test",
    [string]$Host = "localhost",
    [string]$User = "postgres"
)

$Database = "loft_$Environment"

Write-Host "🔍 ANALYSE DE L'ENVIRONNEMENT $($Environment.ToUpper())" -ForegroundColor Green
Write-Host "=================================================="
Write-Host "Base de données: $Host/$Database"
Write-Host ""

try {
    # 1. Utiliser votre script de comptage rapide
    Write-Host "📊 ÉTAPE 1: Comptage des tables..." -ForegroundColor Yellow
    psql -h $Host -U $User -d $Database -f scripts/quick-table-counts.sql
    Write-Host ""

    # 2. Utiliser votre script de vérification des colonnes TV
    Write-Host "📺 ÉTAPE 2: Vérification des colonnes TV..." -ForegroundColor Yellow
    psql -h $Host -U $User -d $Database -f scripts/verify-tv-columns.sql
    Write-Host ""

    # 3. Utiliser votre script de vérification finale
    Write-Host "✅ ÉTAPE 3: Vérification finale..." -ForegroundColor Yellow
    psql -h $Host -U $User -d $Database -f scripts/final-verification.sql
    Write-Host ""

    # 4. Utiliser votre script de diagnostic (si nécessaire)
    Write-Host "🔧 ÉTAPE 4: Diagnostic avancé..." -ForegroundColor Yellow
    psql -h $Host -U $User -d $Database -f scripts/simple-data-check.sql
    Write-Host ""

    Write-Host "🎉 ANALYSE TERMINÉE!" -ForegroundColor Green
    Write-Host "Tous vos scripts existants ont été exécutés avec succès."

} catch {
    Write-Host "❌ ERREUR DURANT L'ANALYSE:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Vérifiez que:" -ForegroundColor Yellow
    Write-Host "  - PostgreSQL client est installé"
    Write-Host "  - La base de données $Database existe"
    Write-Host "  - Les scripts SQL sont dans le dossier scripts/"
}