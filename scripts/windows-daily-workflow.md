# 📅 WORKFLOW QUOTIDIEN DE DÉVELOPPEMENT (Windows)

## 🚀 Commandes PowerShell pour votre travail quotidien

### 1. Clonage complet (début de sprint/semaine)
```powershell
# Cloner PROD vers TEST
.\scripts\quick-clone.ps1 -TargetEnv test

# Cloner PROD vers DEV  
.\scripts\quick-clone.ps1 -TargetEnv dev
```

### 2. Vérification avant développement
```powershell
# Vérifier que l'environnement est prêt
psql -d loft_test -f scripts/final-verification.sql
```

### 3. Comparaison des environnements
```powershell
# Comparer les données
psql -d loft_prod -f scripts/quick-table-counts.sql > prod_counts.txt
psql -d loft_test -f scripts/quick-table-counts.sql > test_counts.txt
Compare-Object (Get-Content prod_counts.txt) (Get-Content test_counts.txt)
```

### 4. Utilisation des scripts existants (ceux qu'on a créés ensemble)
```powershell
# Vérifier les colonnes TV
psql -d loft_test -f scripts/verify-tv-columns.sql

# Synchroniser une colonne manquante
psql -d loft_test -f scripts/sync-missing-column.sql

# Créer des utilisateurs de test
psql -d loft_test -f scripts/create-test-users.sql

# Diagnostic complet
psql -d loft_test -f scripts/diagnose-cloning-issue.sql
```

## 🛠️ Amélioration de vos scripts existants

Vos scripts SQL existants sont parfaits ! Je propose juste d'ajouter:

### Script de lancement Windows
```powershell
# run-analysis.ps1
param([string]$Environment = "test")

Write-Host "🔍 ANALYSE DE L'ENVIRONNEMENT $($Environment.ToUpper())" -ForegroundColor Green

# Utiliser vos scripts existants
psql -d "loft_$Environment" -f scripts/quick-table-counts.sql
psql -d "loft_$Environment" -f scripts/verify-tv-columns.sql  
psql -d "loft_$Environment" -f scripts/final-verification.sql
```

## ⏰ Fréquence recommandée (Windows)

| Action | Fréquence | Commande PowerShell |
|--------|-----------|---------------------|
| Clonage complet | Hebdomadaire | `.\scripts\quick-clone.ps1 test` |
| Vérification | Avant chaque dev | `psql -f scripts\final-verification.sql` |
| Comparaison | Avant release | Scripts de comparaison existants |

## 🎯 Avantages de cette approche

- ✅ **Réutilise vos scripts existants** (pas de doublon)
- ✅ **Compatible Windows** (PowerShell + psql)
- ✅ **Basé sur notre travail** (scripts qu'on a créés ensemble)
- ✅ **Améliore votre workflow** sans tout refaire