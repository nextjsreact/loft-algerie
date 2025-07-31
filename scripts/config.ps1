# =====================================================
# CONFIGURATION POUR VOS ENVIRONNEMENTS
# =====================================================
# Fichier de configuration centralisé - À personnaliser selon votre setup

# 🏢 ENVIRONNEMENT PRODUCTION
$Global:ProdConfig = @{
    Host = "localhost"          # Remplacez par votre serveur PROD
    Database = "loft_prod"      # Nom de votre base PROD
    User = "postgres"           # Utilisateur PostgreSQL
    Port = "5432"              # Port PostgreSQL (généralement 5432)
}

# 🧪 ENVIRONNEMENT TEST
$Global:TestConfig = @{
    Host = "localhost"          # Serveur TEST (souvent le même que DEV)
    Database = "loft_test"      # Nom de votre base TEST
    User = "postgres"           # Utilisateur PostgreSQL
    Port = "5432"              # Port PostgreSQL
}

# 🔧 ENVIRONNEMENT DÉVELOPPEMENT
$Global:DevConfig = @{
    Host = "localhost"          # Serveur DEV (local généralement)
    Database = "loft_dev"       # Nom de votre base DEV
    User = "postgres"           # Utilisateur PostgreSQL
    Port = "5432"              # Port PostgreSQL
}

# 📁 CONFIGURATION DES DOSSIERS
$Global:Paths = @{
    BackupDir = ".\backups"     # Dossier pour les sauvegardes
    ScriptsDir = ".\scripts"    # Dossier des scripts SQL
    LogsDir = ".\logs"          # Dossier pour les logs
}

# 🔐 UTILISATEURS DE TEST (créés automatiquement)
$Global:TestUsers = @(
    @{ Email = "admin@test.local"; Name = "Admin Test"; Role = "admin" },
    @{ Email = "manager@test.local"; Name = "Manager Test"; Role = "manager" },
    @{ Email = "user@test.local"; Name = "User Test"; Role = "member" }
)

# 📋 TABLES À EXCLURE DU CLONAGE (données sensibles)
$Global:ExcludedTables = @(
    "auth.users",
    "auth.sessions", 
    "auth.refresh_tokens",
    "profiles",
    "user_sessions",
    "notifications",
    "messages"
)

# 🎯 FONCTION POUR OBTENIR LA CONFIGURATION D'UN ENVIRONNEMENT
function Get-EnvConfig {
    param([string]$Environment)
    
    switch ($Environment.ToLower()) {
        "prod" { return $Global:ProdConfig }
        "test" { return $Global:TestConfig }
        "dev" { return $Global:DevConfig }
        default { 
            Write-Host "❌ Environnement '$Environment' non reconnu. Utilisez: prod, test, dev" -ForegroundColor Red
            return $null
        }
    }
}

# 🔧 FONCTION POUR CONSTRUIRE LA CHAÎNE DE CONNEXION
function Get-ConnectionString {
    param([hashtable]$Config)
    
    return "postgresql://$($Config.User)@$($Config.Host):$($Config.Port)/$($Config.Database)"
}

# 📊 FONCTION POUR AFFICHER LA CONFIGURATION
function Show-Configuration {
    Write-Host "📋 CONFIGURATION ACTUELLE:" -ForegroundColor Cyan
    Write-Host "=========================="
    
    Write-Host "🏢 PRODUCTION:" -ForegroundColor Yellow
    Write-Host "  Host: $($Global:ProdConfig.Host)"
    Write-Host "  Database: $($Global:ProdConfig.Database)"
    Write-Host "  User: $($Global:ProdConfig.User)"
    Write-Host ""
    
    Write-Host "🧪 TEST:" -ForegroundColor Yellow
    Write-Host "  Host: $($Global:TestConfig.Host)"
    Write-Host "  Database: $($Global:TestConfig.Database)"
    Write-Host "  User: $($Global:TestConfig.User)"
    Write-Host ""
    
    Write-Host "🔧 DÉVELOPPEMENT:" -ForegroundColor Yellow
    Write-Host "  Host: $($Global:DevConfig.Host)"
    Write-Host "  Database: $($Global:DevConfig.Database)"
    Write-Host "  User: $($Global:DevConfig.User)"
    Write-Host ""
    
    Write-Host "📁 DOSSIERS:" -ForegroundColor Yellow
    Write-Host "  Sauvegardes: $($Global:Paths.BackupDir)"
    Write-Host "  Scripts: $($Global:Paths.ScriptsDir)"
    Write-Host "  Logs: $($Global:Paths.LogsDir)"
}

# 🚀 FONCTION DE VÉRIFICATION DES PRÉREQUIS
function Test-Prerequisites {
    Write-Host "🔍 VÉRIFICATION DES PRÉREQUIS..." -ForegroundColor Yellow
    
    $AllGood = $true
    
    # Vérifier PostgreSQL client
    if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Host "❌ psql non trouvé" -ForegroundColor Red
        Write-Host "💡 Installez PostgreSQL client depuis: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        $AllGood = $false
    } else {
        Write-Host "✅ psql trouvé" -ForegroundColor Green
    }
    
    # Vérifier pg_dump
    if (!(Get-Command pg_dump -ErrorAction SilentlyContinue)) {
        Write-Host "❌ pg_dump non trouvé" -ForegroundColor Red
        $AllGood = $false
    } else {
        Write-Host "✅ pg_dump trouvé" -ForegroundColor Green
    }
    
    # Créer les dossiers nécessaires
    foreach ($path in $Global:Paths.Values) {
        if (!(Test-Path $path)) {
            New-Item -ItemType Directory -Path $path -Force | Out-Null
            Write-Host "✅ Dossier créé: $path" -ForegroundColor Green
        }
    }
    
    return $AllGood
}

# Message d'information
Write-Host "📋 Configuration chargée!" -ForegroundColor Green
Write-Host "💡 Utilisez 'Show-Configuration' pour voir les paramètres"
Write-Host "🔧 Modifiez ce fichier selon votre environnement"