# =====================================================
# CLONAGE AUTOMATISÉ PROD → TEST/DEV (Windows PowerShell)
# =====================================================
# Script principal pour cloner PROD vers un environnement

param(
    [string]$TargetEnv = "test",
    [string]$ProdHost = "localhost",
    [string]$ProdDB = "loft_prod", 
    [string]$ProdUser = "postgres",
    [string]$TargetHost = "localhost",
    [string]$TargetUser = "postgres"
)

$TargetDB = "loft_$TargetEnv"
$BackupDir = ".\backups"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "🚀 DÉBUT DU CLONAGE PROD → $($TargetEnv.ToUpper())" -ForegroundColor Green
Write-Host "=================================================="
Write-Host "Source: $ProdHost/$ProdDB"
Write-Host "Cible: $TargetHost/$TargetDB"
Write-Host "Timestamp: $Timestamp"
Write-Host ""

# Créer le dossier de sauvegarde
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

try {
    # ÉTAPE 1: Sauvegarde de sécurité
    Write-Host "📦 ÉTAPE 1: Sauvegarde de sécurité de $($TargetEnv.ToUpper())..." -ForegroundColor Yellow
    $BackupFile = "$BackupDir\${TargetEnv}_backup_${Timestamp}.sql"
    & pg_dump -h $TargetHost -U $TargetUser -d $TargetDB --no-owner --no-privileges | Out-File -FilePath $BackupFile -Encoding UTF8
    Write-Host "✅ Sauvegarde créée: ${TargetEnv}_backup_${Timestamp}.sql" -ForegroundColor Green

    # ÉTAPE 2: Export de la structure depuis PROD
    Write-Host "📤 ÉTAPE 2: Export de la structure depuis PROD..." -ForegroundColor Yellow
    $SchemaFile = "$BackupDir\prod_schema_${Timestamp}.sql"
    & pg_dump -h $ProdHost -U $ProdUser -d $ProdDB --schema-only --no-owner --no-privileges | Out-File -FilePath $SchemaFile -Encoding UTF8
    Write-Host "✅ Structure exportée" -ForegroundColor Green

    # ÉTAPE 3: Export des données essentielles (sans données sensibles)
    Write-Host "📤 ÉTAPE 3: Export des données essentielles..." -ForegroundColor Yellow
    $DataFile = "$BackupDir\prod_data_${Timestamp}.sql"
    & pg_dump -h $ProdHost -U $ProdUser -d $ProdDB --data-only --no-owner --no-privileges --exclude-table=auth.users --exclude-table=auth.sessions --exclude-table=profiles | Out-File -FilePath $DataFile -Encoding UTF8
    Write-Host "✅ Données essentielles exportées (sans données sensibles)" -ForegroundColor Green

    # ÉTAPE 4: Nettoyage de l'environnement cible
    Write-Host "🧹 ÉTAPE 4: Nettoyage de $($TargetEnv.ToUpper())..." -ForegroundColor Yellow
    & psql -h $TargetHost -U $TargetUser -d $TargetDB -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
    & psql -h $TargetHost -U $TargetUser -d $TargetDB -c "DROP SCHEMA IF EXISTS auth CASCADE;"
    Write-Host "✅ Environnement nettoyé" -ForegroundColor Green

    # ÉTAPE 5: Import de la structure
    Write-Host "📥 ÉTAPE 5: Import de la structure..." -ForegroundColor Yellow
    Get-Content $SchemaFile | & psql -h $TargetHost -U $TargetUser -d $TargetDB
    Write-Host "✅ Structure importée" -ForegroundColor Green

    # ÉTAPE 6: Import des données essentielles
    Write-Host "📥 ÉTAPE 6: Import des données essentielles..." -ForegroundColor Yellow
    Get-Content $DataFile | & psql -h $TargetHost -U $TargetUser -d $TargetDB
    Write-Host "✅ Données importées" -ForegroundColor Green

    # ÉTAPE 7: Post-traitement (utilisateurs de test)
    Write-Host "👥 ÉTAPE 7: Création des utilisateurs de test..." -ForegroundColor Yellow
    Get-Content "scripts\create-test-users.sql" | & psql -h $TargetHost -U $TargetUser -d $TargetDB
    Write-Host "✅ Utilisateurs de test créés" -ForegroundColor Green

    # ÉTAPE 8: Vérification automatique
    Write-Host "🔍 ÉTAPE 8: Vérification de la synchronisation..." -ForegroundColor Yellow
    $VerificationResult = & psql -h $TargetHost -U $TargetUser -d $TargetDB -t -c "SELECT json_build_object('profiles', (SELECT COUNT(*) FROM profiles), 'lofts', (SELECT COUNT(*) FROM lofts), 'users', (SELECT COUNT(*) FROM auth.users), 'transactions', (SELECT COUNT(*) FROM transactions));"
    
    Write-Host "📊 Résultats de vérification:" -ForegroundColor Cyan
    Write-Host $VerificationResult

    # ÉTAPE 9: Génération du rapport
    Write-Host "📋 ÉTAPE 9: Génération du rapport..." -ForegroundColor Yellow
    $ReportFile = "$BackupDir\clone_report_${Timestamp}.md"
    $ReportContent = @"
# Rapport de Clonage PROD → $($TargetEnv.ToUpper())

**Date:** $(Get-Date)
**Environnement:** Windows PowerShell

## Environnements
- **Source:** $ProdHost/$ProdDB
- **Cible:** $TargetHost/$TargetDB

## Données clonées
$VerificationResult

## Fichiers générés
- Sauvegarde: ${TargetEnv}_backup_${Timestamp}.sql
- Structure: prod_schema_${Timestamp}.sql  
- Données: prod_data_${Timestamp}.sql
- Rapport: clone_report_${Timestamp}.md

## Utilisateurs de test créés
- admin@test.local (Admin)
- manager@test.local (Manager)
- user@test.local (Utilisateur)
- Mot de passe: test123

## Status
✅ Clonage réussi - Environnement $($TargetEnv.ToUpper()) prêt pour le développement
"@
    
    $ReportContent | Out-File -FilePath $ReportFile -Encoding UTF8
    Write-Host "✅ Rapport généré: clone_report_${Timestamp}.md" -ForegroundColor Green

    Write-Host ""
    Write-Host "🎉 CLONAGE TERMINÉ AVEC SUCCÈS!" -ForegroundColor Green
    Write-Host "=================================================="
    Write-Host "Environnement $($TargetEnv.ToUpper()) prêt pour le développement"
    Write-Host "Rapport: $ReportFile"
    Write-Host ""
    Write-Host "🔐 Connexion de test:" -ForegroundColor Cyan
    Write-Host "Email: admin@test.local"
    Write-Host "Mot de passe: test123"

} catch {
    Write-Host "❌ ERREUR DURANT LE CLONAGE:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}