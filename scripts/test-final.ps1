# Test final de configuration
Write-Host "Test de votre configuration" -ForegroundColor Green

# Test des outils PostgreSQL
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "psql trouve" -ForegroundColor Green
} else {
    Write-Host "psql manquant" -ForegroundColor Red
}

# Test des scripts SQL existants
$sqlScripts = @(
    "quick-table-counts.sql",
    "verify-tv-columns.sql", 
    "create-test-users.sql",
    "final-verification.sql"
)

Write-Host ""
Write-Host "Verification des scripts SQL existants:"
foreach ($script in $sqlScripts) {
    $scriptPath = "scripts\$script"
    if (Test-Path $scriptPath) {
        Write-Host "  $script - OK" -ForegroundColor Green
    } else {
        Write-Host "  $script - MANQUANT" -ForegroundColor Red
    }
}

# Test de la configuration
if (Test-Path "scripts\my-config.ps1") {
    Write-Host ""
    Write-Host "Configuration personnalisee trouvee" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Configuration personnalisee manquante" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pret pour le clonage!" -ForegroundColor Green
Write-Host "Commandes disponibles:"
Write-Host "  .\scripts\quick-clone.ps1 test"
Write-Host "  .\scripts\run-analysis.ps1 test"