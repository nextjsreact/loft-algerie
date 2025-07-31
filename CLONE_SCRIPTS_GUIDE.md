# 🔄 Guide des Scripts de Clonage Intelligent

Ce guide documente les scripts de clonage intelligent créés pour synchroniser les données entre les environnements de production, test et développement.

## 📋 Scripts Disponibles

### Scripts de Clonage Intelligent

| Script | Commande | Description |
|--------|----------|-------------|
| **Prod → Test** | `npm run smart-clone:prod-to-test` | Clone intelligent de production vers test |
| **Prod → Dev** | `npm run smart-clone:prod-to-dev` | Clone intelligent de production vers développement |

### Scripts de Diagnostic

| Script | Commande | Description |
|--------|----------|-------------|
| **Diagnostic Complet** | `npm run diagnose:all` | Analyse tous les environnements |
| **Diagnostic Production** | `npm run diagnose:schema` | Analyse la compatibilité de production |

### Scripts de Clonage Classiques (avec problèmes)

| Script | Commande | Description |
|--------|----------|-------------|
| **Prod → Test** | `npm run clone:prod-to-test` | ⚠️ Problèmes de cache Supabase |
| **Prod → Dev** | `npm run clone:prod-to-dev` | ⚠️ Problèmes de cache Supabase |

## 🧠 Fonctionnalités des Scripts Intelligents

### ✅ **Adaptation Automatique de Schéma**
- Détecte automatiquement les colonnes disponibles dans chaque environnement
- Adapte les données source aux colonnes cibles
- Gère les colonnes manquantes avec des valeurs par défaut

### ✅ **Gestion des Erreurs Avancée**
- Insertion par lots avec fallback individuel
- Rapports détaillés des succès et erreurs
- Diagnostic des problèmes de données

### ✅ **Support Complet des Fonctionnalités**
- **📺 TV Subscription**: Champs `frequence_paiement_tv` et `prochaine_echeance_tv`
- **💰 Pricing Quotidien**: Support du pricing en DA (Dinar Algérien)
- **🌐 Multi-langue**: Préservation des traductions AR/FR/EN

## 🔍 Problèmes Résolus

### **1. Erreurs de Cache Supabase**
- **Problème**: `Could not find the 'updated_at' column in the schema cache`
- **Solution**: Scripts intelligents qui détectent la structure réelle des tables

### **2. Différences de Schéma**
- **Problème**: Colonnes différentes entre environnements
- **Solution**: Adaptation automatique des données aux colonnes disponibles

### **3. Données Invalides**
- **Problème**: Valeurs `"undefined"` dans `internet_connection_types`
- **Solution**: Nettoyage et adaptation des données lors du clonage

### **4. Contraintes de Clés Étrangères**
- **Problème**: Violations de contraintes lors de l'insertion
- **Solution**: Ordre de clonage respectant les dépendances

## 📊 Résultats de Synchronisation

Après utilisation des scripts intelligents, tous les environnements sont parfaitement synchronisés :

```
📈 PRODUCTION: 116 enregistrements total
📈 TEST: 116 enregistrements total  
📈 DÉVELOPPEMENT: 116 enregistrements total
🎉 TOUS LES ENVIRONNEMENTS SONT SYNCHRONISÉS!
```

### Tables Synchronisées
- ✅ `zone_areas`: 6 enregistrements
- ✅ `internet_connection_types`: 13 enregistrements
- ✅ `loft_owners`: 3 enregistrements
- ✅ `categories`: 13 enregistrements
- ✅ `currencies`: 3 enregistrements
- ✅ `payment_methods`: 3 enregistrements
- ✅ `teams`: 1 enregistrement
- ✅ `tasks`: 53 enregistrements
- ✅ `transaction_category_references`: 19 enregistrements
- ✅ `settings`: 2 enregistrements

## 🚀 Utilisation Recommandée

### Pour Synchroniser Test avec Production
```bash
npm run smart-clone:prod-to-test
```

### Pour Synchroniser Développement avec Production
```bash
npm run smart-clone:prod-to-dev
```

### Pour Vérifier la Synchronisation
```bash
npm run diagnose:all
```

## ⚠️ Précautions

1. **Sauvegarde**: Les scripts remplacent les données existantes
2. **Confirmation**: Confirmation requise avant exécution
3. **Données Sensibles**: Les profils utilisateurs sont préservés
4. **Environnement**: Vérifiez que les fichiers `.env.*` sont correctement configurés

## 🔧 Fichiers de Configuration Requis

- `.env.prod` - Configuration production
- `.env.test` - Configuration test  
- `.env.development` - Configuration développement

## 📝 Logs et Rapports

Les scripts génèrent des rapports détaillés incluant :
- Nombre d'enregistrements traités par table
- Erreurs rencontrées avec détails
- Temps d'exécution et statistiques
- Recommandations post-clonage

## 🎯 Fonctionnalités Confirmées

✅ **TV Subscription**: Champs présents dans tous les environnements  
✅ **Pricing Quotidien (DA)**: Configuré correctement  
✅ **Multi-langue (AR/FR/EN)**: Traductions complètes  
✅ **Synchronisation**: Tous les environnements alignés  

---

*Dernière mise à jour: 30 juillet 2025*