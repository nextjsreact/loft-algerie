# Plan de Migration des Données PROD → TEST

## 🚨 Problème Identifié
Le clonage n'a copié que la **structure** (schémas, tables, colonnes) mais pas les **données**.

## 📊 Étapes de Diagnostic

### 1. Vérifier les Données Manquantes
```sql
-- Exécuter sur PROD et TEST pour comparer
SELECT 'profiles' as table_name, COUNT(*) FROM profiles
UNION ALL
SELECT 'lofts', COUNT(*) FROM lofts
UNION ALL  
SELECT 'users', COUNT(*) FROM auth.users;
```

### 2. Identifier les Tables Critiques
- `profiles` - Profils utilisateurs
- `lofts` - Données des lofts
- `auth.users` - Utilisateurs système
- `transactions` - Transactions financières
- `loft_owners` - Propriétaires
- `currencies` - Devises
- `categories` - Catégories

## 🔧 Solutions Possibles

### Option A: Migration Sélective (Recommandée pour TEST)
```sql
-- Copier seulement les données essentielles
-- Éviter les données sensibles (mots de passe, tokens)
```

### Option B: Dump/Restore Complet
```bash
# Exporter depuis PROD
pg_dump --data-only --exclude-table=auth.users prod_db > data_export.sql

# Importer vers TEST  
psql test_db < data_export.sql
```

### Option C: Synchronisation Manuelle
Créer des scripts pour chaque table critique.

## ⚠️ Précautions
- **NE PAS** copier les mots de passe utilisateurs
- **NE PAS** copier les tokens d'authentification
- **ANONYMISER** les données personnelles
- **VÉRIFIER** les contraintes de clés étrangères

## 🎯 Recommandation
1. Commencer par les **données de configuration** (currencies, categories)
2. Puis les **données de base** (loft_owners, lofts)
3. Créer des **utilisateurs de test** plutôt que copier les vrais
4. **Éviter** les données transactionnelles sensibles