# ===========================================
# SCRIPT DE BASCULEMENT D'ENVIRONNEMENT
# ===========================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "test", "prod")]
    [string]$Environment
)

$envFiles = @{
    "dev" = ".env.development"
    "test" = ".env.test"
    "prod" = ".env.production"
}

$envNames = @{
    "dev" = "Développement"
    "test" = "Test/Staging"
    "prod" = "Production"
}

$sourceFile = $envFiles[$Environment]
$targetFile = ".env.local"

Write-Host "🔄 Basculement vers l'environnement: $($envNames[$Environment])" -ForegroundColor Yellow
Write-Host "=" * 50

# Vérifier que le fichier source existe
if (-not (Test-Path $sourceFile)) {
    Write-Host "❌ Erreur: Le fichier $sourceFile n'existe pas!" -ForegroundColor Red
    Write-Host "💡 Créez d'abord ce fichier ou exécutez la configuration appropriée." -ForegroundColor Cyan
    exit 1
}

# Sauvegarder l'environnement actuel si .env.local existe
if (Test-Path $targetFile) {
    $backupFile = ".env.local.backup"
    Copy-Item $targetFile $backupFile -Force
    Write-Host "💾 Environnement actuel sauvegardé dans $backupFile" -ForegroundColor Green
}

# Copier le nouvel environnement
try {
    Copy-Item $sourceFile $targetFile -Force
    Write-Host "✅ Basculement réussi vers l'environnement $($envNames[$Environment])" -ForegroundColor Green
    
    # Afficher quelques informations sur l'environnement
    Write-Host ""
    Write-Host "📋 Informations sur l'environnement:" -ForegroundColor Cyan
    
    $content = Get-Content $targetFile
    $supabaseUrl = ($content | Where-Object { $_ -match "NEXT_PUBLIC_SUPABASE_URL=" }) -replace "NEXT_PUBLIC_SUPABASE_URL=", ""
    $nodeEnv = ($content | Where-Object { $_ -match "NODE_ENV=" }) -replace "NODE_ENV=", ""
    $appUrl = ($content | Where-Object { $_ -match "NEXT_PUBLIC_APP_URL=" }) -replace "NEXT_PUBLIC_APP_URL=", ""
    
    if ($supabaseUrl) { Write-Host "🗄️ Base de données: $supabaseUrl" -ForegroundColor White }
    if ($nodeEnv) { Write-Host "⚙️ Mode: $nodeEnv" -ForegroundColor White }
    if ($appUrl) { Write-Host "🌐 URL: $appUrl" -ForegroundColor White }
    
    Write-Host ""
    Write-Host "🚀 Vous pouvez maintenant démarrer l'application avec: npm run dev" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur lors du basculement: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Commandes utiles:" -ForegroundColor Magenta
Write-Host "• npm run test-env        - Tester la connexion DB"
Write-Host "• npm run health:check    - Vérifier la santé de l'app"
Write-Host "• npm run dev            - Démarrer le serveur"