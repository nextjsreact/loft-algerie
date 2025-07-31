# 🚀 Guide d'Intégration de Production Existante

## 📋 Vue d'Ensemble

Ce guide vous aide à intégrer votre base de données de production existante dans votre architecture multi-environnements et à configurer le clonage de données.

## 🎯 Étape 1: Intégration de la Production Existante

### Configuration Automatique (RECOMMANDÉ)
```bash
npm run integrate:prod
```

### Configuration Manuelle
1. Créez le fichier `.env.production` avec vos clés Supabase de production
2. Configurez toutes les variables d'environnement nécessaires

## 🔍 Étape 2: Diagnostic de Compatibilité

Vérifiez si votre production est compatible avec le nouveau schéma :

```bash
# Basculer vers la production
npm run env:switch:prod

# Diagnostiquer la compatibilité
npm run diagnose:schema
```

Le diagnostic vérifiera :
- ✅ Toutes les tables nécessaires
- ✅ Les colonnes requises (incluant les nouveaux champs TV)
- ✅ Le nombre d'enregistrements
- ✅ La compatibilité générale

## 🔄 Étape 3: Clonage de Données

### Scripts Disponibles

#### Production → Test
```bash
npm run clone:prod-to-test
```
- Clone toutes les données de production vers test
- Exclut automatiquement les données sensibles
- Remplace les données existantes en test

#### Production → Développement
```bash
npm run clone:prod-to-dev
```
- Clone toutes les données de production vers développement
- Exclut automatiquement les données sensibles
- Remplace les données existantes en développement

#### Test → Développement
```bash
npm run clone:test-to-dev
```
- Clone les données de test vers développement
- Utile pour synchroniser après des tests

### Données Clonées

Le clonage inclut :
- ✅ **Lofts** avec toutes les informations de facturation (incluant TV)
- ✅ **Propriétaires** et informations de contact
- ✅ **Transactions** financières
- ✅ **Catégories** et classifications
- ✅ **Zones géographiques**
- ✅ **Types de connexion internet**
- ✅ **Équipes** et assignations
- ✅ **Tâches** et leur statut
- ✅ **Paramètres** de l'application

### Données Exclues (Sécurité)

Par défaut, ces données sensibles sont exclues :
- ❌ **Profils utilisateurs** (données personnelles)
- ❌ **Sessions utilisateurs** (sécurité)
- ❌ **Notifications** (spécifiques aux utilisateurs)

## 🛡️ Sécurité et Bonnes Pratiques

### Protections Intégrées

1. **Sens unique** : Le clonage ne peut JAMAIS aller vers la production
2. **Confirmation** : Double confirmation pour les opérations destructives
3. **Exclusion automatique** : Les données sensibles sont exclues par défaut
4. **Mode test** : Option `--dry-run` pour tester sans modifier

### Recommandations

- 🔒 **Sauvegardez** votre production avant toute modification
- 🕐 **Planifiez** le clonage pendant les heures creuses
- 🧪 **Testez** d'abord avec `--dry-run`
- 📊 **Vérifiez** les données après clonage

## 📅 Utilisation Recommandée

### Fréquence de Clonage

- **Production → Test** : Hebdomadaire ou avant les tests importants
- **Production → Dev** : Mensuel ou quand vous avez besoin de données fraîches
- **Test → Dev** : Après validation des tests

### Workflow Typique

```bash
# 1. Cloner la production vers test pour les tests
npm run clone:prod-to-test

# 2. Basculer vers test et valider
npm run env:switch:test
npm run dev

# 3. Si tout va bien, cloner vers dev si nécessaire
npm run clone:prod-to-dev

# 4. Retourner au développement
npm run env:switch:dev
```

## 🔧 Commandes Utiles

### Gestion des Environnements
```bash
npm run env:switch:prod    # Basculer vers production
npm run env:switch:test    # Basculer vers test
npm run env:switch:dev     # Basculer vers développement
```

### Diagnostic et Tests
```bash
npm run diagnose:schema    # Vérifier la compatibilité
npm run test-env          # Tester la connexion
npm run health:check      # Vérifier la santé de l'app
```

### Clonage de Données
```bash
npm run clone:prod-to-test    # Production → Test
npm run clone:prod-to-dev     # Production → Développement
npm run clone:test-to-dev     # Test → Développement
```

## 🆘 Dépannage

### Problèmes Courants

1. **Erreur de connexion à la production**
   - Vérifiez les clés dans `.env.production`
   - Vérifiez les permissions de votre compte Supabase

2. **Tables manquantes**
   - Exécutez `npm run diagnose:schema`
   - Appliquez les migrations nécessaires

3. **Échec du clonage**
   - Vérifiez l'espace disponible dans la base cible
   - Vérifiez les contraintes de clés étrangères

4. **Données incomplètes**
   - Vérifiez les logs de clonage
   - Relancez le clonage pour les tables en erreur

### Support

Si vous rencontrez des problèmes :
1. Consultez les logs détaillés
2. Vérifiez la compatibilité du schéma
3. Testez avec `--dry-run` d'abord
4. Vérifiez les permissions Supabase

## 📊 Monitoring

Après chaque clonage :
- ✅ Vérifiez le nombre d'enregistrements clonés
- ✅ Testez les fonctionnalités principales
- ✅ Vérifiez les alertes de facturation
- ✅ Validez les données sensibles

---

**🎯 Avec cette configuration, vous avez maintenant un système professionnel de gestion des données entre vos environnements !**