# Test simple de configuration
Write-Host "Test de votre configuration" -ForegroundColor Green

# Charger la config
if (Test-Path "scripts\my-config.ps1") {
    . .\scripts\my-config.ps1
    Write-Host "Configuration chargee" -ForegroundColor Green
} else {
    Write-Host "Configuration non trouvee" -ForegroundColor Red
    exit 1
}

# Test des outils
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "psql: OK" -ForegroundColor Green
} else {
    Write-Host "psql: MANQUANT" -ForegroundColor Red
}

if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
    Write-Host "pg_dump: OK" -ForegroundColor Green
} else {
    Write-Host "pg_dump: MANQUANT" -ForegroundColor Red
}

# Test des dossiers
$folders = @("scripts", "backups", "logs")
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "Dossier $folder: OK" -ForegroundColor Green
    } else {
        Write-Host "Dossier $folder: MANQUANT" -ForegroundColor Red
    }
}

# Test des scripts SQL
$scripts = @("quick-table-counts.sql", "verify-tv-columns.sql", "create-test-users.sql")
foreach ($script in $scripts) {
    if (Test-Path "scripts\$script") {
        Write-Host "Script $script: OK" -ForegroundColor Green
    } else {
        Write-Host "Script $script: MANQUANT" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Configuration prete pour le clonage!" -ForegroundColor Green