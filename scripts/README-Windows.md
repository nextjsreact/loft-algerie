# 🚀 Guide de Configuration - Clonage PROD vers TEST/DEV (Windows)

## 📋 Étapes de Configuration

### 1. Configuration Initiale (À faire une seule fois)
```powershell
# Étape 1: Configuration interactive de vos paramètres
.\scripts\setup-environment.ps1

# Étape 2: Test de votre configuration
.\scripts\test-my-setup.ps1
```

### 2. Utilisation Quotidienne
```powershell
# Clonage rapide PROD → TEST
.\scripts\quick-clone.ps1 test

# Clonage rapide PROD → DEV
.\scripts\quick-clone.ps1 dev

# Analyse complète d'un environnement
.\scripts\run-analysis.ps1 test
```

## 🔧 Personnalisation de Votre Configuration

Le script `setup-environment.ps1` va vous demander :

### 🏢 Environnement PRODUCTION
- **Host PROD** : Adresse de votre serveur de production
- **Base PROD** : Nom de votre base de données de production
- **Utilisateur PROD** : Nom d'utilisateur PostgreSQL pour PROD

### 🧪 Environnement TEST
- **Host TEST** : Adresse de votre serveur de test (souvent localhost)
- **Base TEST** : Nom de votre base de données de test
- **Utilisateur TEST** : Nom d'utilisateur PostgreSQL pour TEST

### 🔧 Environnement DEV
- **Host DEV** : Adresse de votre serveur de développement (souvent localhost)
- **Base DEV** : Nom de votre base de données de développement
- **Utilisateur DEV** : Nom d'utilisateur PostgreSQL pour DEV

## 📁 Structure des Fichiers Créés

```
scripts/
├── config.ps1              # Configuration par défaut
├── my-config.ps1           # VOTRE configuration personnalisée
├── setup-environment.ps1   # Configuration interactive
├── test-my-setup.ps1      # Test de configuration
├── quick-clone.ps1         # Clonage rapide
├── clone-prod-to-env.ps1   # Clonage complet
├── run-analysis.ps1        # Analyse avec vos scripts SQL
└── [vos scripts SQL existants]

backups/                    # Sauvegardes automatiques
logs/                      # Logs des opérations
```

## 🎯 Exemple de Configuration Typique

```powershell
# Production (serveur distant)
Host: "prod-server.company.com"
Database: "loft_production"
User: "app_user"

# Test (serveur local ou distant)
Host: "localhost"
Database: "loft_test"
User: "postgres"

# Dev (local)
Host: "localhost"
Database: "loft_dev"
User: "postgres"
```

## 🔐 Sécurité

Les scripts excluent automatiquement les données sensibles :
- ❌ Mots de passe utilisateurs (`auth.users`)
- ❌ Sessions (`auth.sessions`)
- ❌ Tokens (`auth.refresh_tokens`)
- ❌ Profils utilisateurs (`profiles`)
- ✅ Crée des utilisateurs de test automatiquement

## 🚨 Dépannage

### Erreur "psql non trouvé"
```powershell
# Installez PostgreSQL client depuis:
# https://www.postgresql.org/download/windows/
```

### Erreur de connexion
```powershell
# Vérifiez vos paramètres dans scripts\my-config.ps1
# Testez manuellement:
psql -h your-host -U your-user -d your-database
```

### Scripts SQL manquants
```powershell
# Vérifiez que tous vos scripts SQL sont dans le dossier scripts/
.\scripts\test-my-setup.ps1
```

## 🎉 Après Configuration

Une fois configuré, vous pourrez :
1. **Cloner PROD vers TEST** en 1 commande
2. **Analyser vos environnements** automatiquement
3. **Vérifier la synchronisation** facilement
4. **Développer sereinement** avec des données cohérentes

## 💡 Conseils

- Exécutez `test-my-setup.ps1` régulièrement pour vérifier votre configuration
- Modifiez `scripts\my-config.ps1` si vos paramètres changent
- Les sauvegardes sont automatiques dans le dossier `backups/`
- Tous vos scripts SQL existants sont réutilisés (pas de duplication)