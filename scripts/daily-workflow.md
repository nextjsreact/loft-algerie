# 📅 WORKFLOW QUOTIDIEN DE DÉVELOPPEMENT

## 🚀 Commandes principales pour votre travail quotidien

### 1. Clonage complet (début de sprint/semaine)
```bash
# Cloner PROD vers TEST
./scripts/quick-clone.sh test

# Cloner PROD vers DEV  
./scripts/quick-clone.sh dev
```

### 2. Synchronisation rapide (quotidienne)
```bash
# Mettre à jour TEST avec les changements des 3 derniers jours
./scripts/incremental-sync.sh test 3

# Mettre à jour DEV
./scripts/incremental-sync.sh dev 1
```

### 3. Vérification avant développement
```bash
# Vérifier que l'environnement est prêt
psql -d loft_test -f scripts/final-verification.sql
```

### 4. Comparaison des environnements
```bash
# Comparer les schémas
psql -d loft_prod -f scripts/quick-table-counts.sql > prod_counts.txt
psql -d loft_test -f scripts/quick-table-counts.sql > test_counts.txt
diff prod_counts.txt test_counts.txt
```

## ⏰ Fréquence recommandée

| Action | Fréquence | Commande |
|--------|-----------|----------|
| Clonage complet | Hebdomadaire | `./scripts/quick-clone.sh test` |
| Sync incrémentale | Quotidienne | `./scripts/incremental-sync.sh test 1` |
| Vérification | Avant chaque dev | `psql -f scripts/final-verification.sql` |
| Comparaison | Avant release | Scripts de comparaison |

## 🎯 Avantages pour votre workflow

- ⚡ **Rapidité**: Clonage en quelques minutes vs heures
- 🔒 **Sécurité**: Pas de données sensibles en TEST/DEV
- 📊 **Cohérence**: Données toujours synchronisées
- 🛠️ **Automatisation**: Moins d'interventions manuelles
- 📋 **Traçabilité**: Rapports de chaque opération

## 🔧 Personnalisation

Modifiez les variables dans les scripts selon votre environnement:
- Hosts de base de données
- Noms des bases
- Utilisateurs
- Tables à exclure/inclure