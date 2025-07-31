# 📤 Guide d'Export de Base de Données

## 🚀 Commandes Disponibles

### Export Complet
```bash
# Export complet de PRODUCTION
npm run export:prod

# Export complet de TEST
npm run export:test

# Export complet de DEV
npm run export:dev
```

### Export Anonymisé (Recommandé pour partage)
```bash
# Export PROD avec données anonymisées
npm run export:prod:anonymized

# Export TEST avec données anonymisées
npm run export:test:anonymized
```

### Export Rapide (Tables essentielles uniquement)
```bash
# Export rapide PROD
npm run quick-export:prod

# Export rapide TEST
npm run quick-export:test

# Export rapide DEV
npm run quick-export:dev
```

## 📁 Fichiers Générés

### Format des noms de fichiers
- **Export complet**: `{env}_database_export_{date}_{heure}.json`
- **Export rapide**: `{env}_quick_export_{date}_{heure}.json`
- **Résumé**: `{env}_export_summary_{date}_{heure}.json`

### Exemple
```
exports/
├── prod_database_export_2025-07-31_02-30-15.json
├── prod_export_summary_2025-07-31_02-30-15.json
└── test_quick_export_2025-07-31_02-35-20.json
```

## 📊 Structure des Exports

### Export Complet
```json
{
  "metadata": {
    "environment": "prod",
    "timestamp": "2025-07-31T02:30:15.123Z",
    "total_tables": 15,
    "total_records": 1250,
    "anonymized": false
  },
  "tables": {
    "lofts": {
      "status": "success",
      "records": 3,
      "data": [...]
    },
    "profiles": {
      "status": "success", 
      "records": 9,
      "data": [...]
    }
  }
}
```

### Export Rapide
```json
{
  "environment": "test",
  "timestamp": "2025-07-31T02:35:20.456Z",
  "tables": {
    "lofts": {
      "records": 3,
      "data": [...]
    }
  }
}
```

## 🔒 Sécurité et Anonymisation

### Données Anonymisées Automatiquement
- **Emails**: Remplacés par `user123@{env}.local`
- **Noms**: Remplacés par `User ABC`
- **Téléphones**: Remplacés par `+213XXXXXXXX`
- **Adresses**: Remplacées par `Adresse anonymisée`
- **Messages**: Contenu anonymisé
- **Tokens**: Supprimés complètement

### Tables Sensibles
- `profiles` - Données utilisateurs
- `loft_owners` - Informations propriétaires
- `messages` - Messages privés
- `notifications` - Notifications personnelles

## 🎯 Cas d'Usage

### 1. Sauvegarde de Production
```bash
npm run export:prod
```
**Usage**: Sauvegarde complète avant mise à jour majeure

### 2. Partage avec l'équipe
```bash
npm run export:prod:anonymized
```
**Usage**: Partager des données réalistes sans informations sensibles

### 3. Debug rapide
```bash
npm run quick-export:test
```
**Usage**: Export rapide pour analyser un problème

### 4. Migration de données
```bash
npm run export:prod
# Puis utiliser le fichier pour import dans un autre environnement
```

## ⚡ Performances

### Export Complet
- **Durée**: 30-60 secondes selon la taille
- **Taille**: 1-10 MB selon les données
- **Tables**: Toutes les tables principales

### Export Rapide
- **Durée**: 5-15 secondes
- **Taille**: 100KB-1MB
- **Tables**: 6 tables essentielles uniquement

## 🛠️ Options Avancées

### Utilisation directe du script
```bash
# Export avec options personnalisées
npm run tsx scripts/export-database.ts prod --anonymize --exclude-auth

# Export rapide personnalisé
npm run tsx scripts/quick-export.ts test
```

### Options disponibles
- `--anonymize`: Anonymiser les données sensibles
- `--exclude-auth`: Exclure les tables d'authentification

## 📋 Vérification des Exports

### Vérifier un export
```bash
# Compter les enregistrements dans un export
node -e "const data = require('./exports/prod_database_export_2025-07-31_02-30-15.json'); console.log('Total records:', data.metadata.total_records)"
```

### Lister les tables exportées
```bash
# Voir les tables dans un export
node -e "const data = require('./exports/prod_database_export_2025-07-31_02-30-15.json'); console.log('Tables:', Object.keys(data.tables))"
```

## 🚨 Bonnes Pratiques

1. **Toujours anonymiser** pour les partages externes
2. **Vérifier la taille** des fichiers avant partage
3. **Nettoyer régulièrement** le dossier exports/
4. **Sauvegarder** avant les opérations critiques
5. **Tester les exports** sur un petit environnement d'abord