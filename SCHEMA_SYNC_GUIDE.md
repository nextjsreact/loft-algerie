# 🔄 GUIDE COMPLET DE SYNCHRONISATION DES SCHÉMAS

Ce guide vous aide à résoudre tous les problèmes de synchronisation entre vos environnements de développement, test et production.

## 🎯 Problème Principal

Le problème principal est la **synchronisation des schémas** entre les environnements, ce qui empêche le clonage réussi des données.

## 🛠️ Nouveaux Outils Disponibles

### 1. Diagnostic Complet
```bash
npm run diagnose:complete
```
- Analyse tous les environnements
- Identifie tous les problèmes de synchronisation
- Fournit des recommandations précises
- Génère un rapport détaillé

### 2. Synchronisation Universelle des Schémas
```bash
# Synchroniser depuis prod vers tous les environnements
npm run sync:universal

# Synchroniser depuis prod vers test uniquement
npm run sync:prod-to-test

# Synchroniser depuis prod vers dev uniquement
npm run sync:prod-to-dev

# Synchroniser depuis test vers dev
npm run sync:test-to-dev
```

### 3. Clonage Intelligent
```bash
# Clone avec adaptation automatique aux différences de schéma
npm run clone:prod-to-test-smart
npm run clone:prod-to-dev-smart
npm run clone:test-to-dev-smart
```

## 📋 Processus de Résolution Étape par Étape

### Étape 1: Diagnostic Initial
```bash
npm run diagnose:complete
```

Cette commande va :
- ✅ Vérifier la connexion à tous les environnements
- 📋 Analyser toutes les tables dans chaque environnement
- 🔍 Identifier les tables manquantes
- 📊 Comparer les colonnes entre environnements
- 📄 Générer un rapport complet

### Étape 2: Synchronisation des Schémas

Selon les résultats du diagnostic :

#### Si des tables ou colonnes manquent :
```bash
# Synchroniser depuis production (recommandé)
npm run sync:prod-to-test
npm run sync:prod-to-dev
```

#### Si vous voulez synchroniser depuis test vers dev :
```bash
npm run sync:test-to-dev
```

**Important :** Ces commandes génèrent des scripts SQL que vous devez exécuter manuellement dans vos environnements cibles.

### Étape 3: Vérification Post-Synchronisation
```bash
npm run diagnose:complete
```

Relancez le diagnostic pour vérifier que tous les problèmes sont résolus.

### Étape 4: Clonage des Données
```bash
# Une fois les schémas synchronisés, clonez les données
npm run clone:prod-to-test-smart
npm run clone:prod-to-dev-smart
```

## 🔧 Fonctionnalités Avancées

### Adaptation Automatique des Schémas

Le système de clonage intelligent :
- 🔄 **Adapte automatiquement** les données aux différences de schéma
- ➕ **Ajoute des valeurs par défaut** pour les colonnes manquantes
- 🗑️ **Ignore les colonnes supplémentaires** de la source
- 📊 **Insère par lots** pour éviter les timeouts
- 🔍 **Diagnostique les erreurs** individuellement

### Gestion des Colonnes Spéciales

Le système gère automatiquement :
- `created_at` / `updated_at` : Ajoute la date actuelle
- Clés étrangères (`*_id`) : Met à `null` si manquantes
- Colonnes système : Utilise les valeurs par défaut de la DB

## 📊 Rapports Générés

### Rapport de Diagnostic
- `complete_sync_diagnosis_[timestamp].json`
- Analyse complète de tous les environnements
- Liste détaillée de tous les problèmes
- Recommandations spécifiques

### Rapport de Synchronisation
- `schema_sync_report_[timestamp].json`
- Résumé des synchronisations effectuées
- Scripts SQL générés
- Statistiques par environnement

### Rapport de Clonage
- `clone_report_[source]_to_[target]_[timestamp].json`
- Détails du clonage par table
- Adaptations effectuées
- Erreurs rencontrées

## 🚨 Sécurité et Bonnes Pratiques

### Protections Intégrées
- ❌ **Impossible de modifier la production** via clonage
- 💾 **Sauvegarde automatique** avant modifications importantes
- 🔍 **Validation des environnements** avant opérations
- 📋 **Audit complet** de toutes les opérations

### Recommandations
1. **Toujours diagnostiquer** avant de synchroniser
2. **Tester sur dev** avant d'appliquer sur test
3. **Sauvegarder** avant les opérations importantes
4. **Vérifier les rapports** après chaque opération

## 🔄 Workflow Recommandé

```bash
# 1. Diagnostic initial
npm run diagnose:complete

# 2. Synchroniser les schémas (si nécessaire)
npm run sync:prod-to-test
npm run sync:prod-to-dev

# 3. Exécuter les scripts SQL générés dans vos environnements

# 4. Vérifier la synchronisation
npm run diagnose:complete

# 5. Cloner les données
npm run clone:prod-to-test-smart
npm run clone:prod-to-dev-smart

# 6. Vérification finale
npm run diagnose:complete
```

## 🆘 Résolution de Problèmes

### Erreur de Connexion
```
❌ Environnement non connecté
```
**Solution :** Vérifiez vos fichiers `.env.*` et les clés Supabase

### Table Manquante
```
❌ Table manquante dans: test, dev
```
**Solution :** Utilisez `npm run sync:prod-to-test` et exécutez le script généré

### Colonnes Manquantes
```
❌ Colonnes manquantes dans test: frequence_paiement_tv, prochaine_echeance_tv
```
**Solution :** Le script de synchronisation ajoutera automatiquement ces colonnes

### Erreur de Clonage
```
❌ Erreur insertion: column "new_column" does not exist
```
**Solution :** Synchronisez d'abord les schémas, puis relancez le clonage

## 📞 Support

Si vous rencontrez des problèmes :

1. **Consultez les rapports** générés pour plus de détails
2. **Vérifiez les logs** dans la console
3. **Relancez le diagnostic** après chaque modification
4. **Utilisez les scripts étape par étape** plutôt que les scripts automatiques

## 🎉 Résultat Attendu

Après avoir suivi ce guide :
- ✅ Tous les environnements ont le même schéma
- ✅ Les données se clonent sans erreur
- ✅ Les nouveaux développeurs peuvent facilement cloner les environnements
- ✅ Le système est maintenu synchronisé automatiquement

---

**Note :** Ce système est conçu pour être sûr et réversible. Toutes les opérations génèrent des rapports détaillés et des sauvegardes automatiques.