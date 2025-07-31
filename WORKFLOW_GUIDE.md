# 🚀 Guide de Workflow Multi-Environnements

## 📋 Structure des Branches

```
main (production)     ← Code stable en production
├── staging (test)    ← Code en cours de validation
└── develop (dev)     ← Code en développement actif
    ├── feature/login-improvement
    ├── feature/new-dashboard
    └── bugfix/profile-sync
```

## 🔄 Workflow de Développement

### 1. Développement Local
```bash
# Travailler sur une nouvelle fonctionnalité
git checkout develop
git pull origin develop
git checkout -b feature/nouvelle-fonctionnalite

# Développer et tester localement
npm run dev  # Utilise .env.development

# Commiter les changements
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite
```

### 2. Intégration en Développement
```bash
# Merger dans develop
git checkout develop
git merge feature/nouvelle-fonctionnalite
git push origin develop

# Auto-déploiement vers l'environnement de développement
# URL: https://dev-loft-algerie.vercel.app
```

### 3. Promotion vers Test
```bash
# Quand le développement est stable
git checkout staging
git merge develop
git push origin staging

# Auto-déploiement vers l'environnement de test
# URL: https://test-loft-algerie.vercel.app
```

### 4. Déploiement en Production
```bash
# Après validation complète en test
git checkout main
git merge staging
git push origin main

# Auto-déploiement vers la production
# URL: https://loft-algerie.com
```

## 🌐 Environnements et URLs

| Environnement | Branche   | URL                              | Base de Données    |
|---------------|-----------|----------------------------------|--------------------|
| Développement | develop   | https://dev-loft-algerie.vercel.app  | dev-supabase      |
| Test          | staging   | https://test-loft-algerie.vercel.app | test-supabase     |
| Production    | main      | https://loft-algerie.com         | prod-supabase     |

## 🔧 Configuration par Environnement

### Variables d'Environnement
- **Développement**: `.env.development` → Base dev
- **Test**: `.env.test` → Base test  
- **Production**: `.env.production` → Base prod

### Déploiement Automatique
- **Push sur develop** → Déploie automatiquement en dev
- **Push sur staging** → Déploie automatiquement en test
- **Push sur main** → Déploie automatiquement en prod

## 🛡️ Règles de Protection

### Branches Protégées
- `main`: Require PR + Reviews + Tests
- `staging`: Require PR + Tests
- `develop`: Libre pour l'équipe

### Tests Automatiques
- **Develop**: Tests unitaires
- **Staging**: Tests complets + E2E
- **Main**: Tests critiques + Smoke tests

## 🎯 Bonnes Pratiques

### 1. Développement
- ✅ Toujours partir de `develop`
- ✅ Créer des branches feature/bugfix
- ✅ Tester localement avant de push
- ✅ Faire des commits atomiques

### 2. Validation
- ✅ Tester en staging avant prod
- ✅ Valider avec les utilisateurs finaux
- ✅ Vérifier les performances
- ✅ Tester les migrations de données

### 3. Production
- ✅ Déployer uniquement du code validé
- ✅ Avoir un plan de rollback
- ✅ Monitorer après déploiement
- ✅ Communiquer les changements

## 🚨 Gestion des Urgences

### Hotfix en Production
```bash
# Créer un hotfix depuis main
git checkout main
git checkout -b hotfix/critical-bug

# Corriger le bug
# Tester localement

# Merger directement en main ET staging
git checkout main
git merge hotfix/critical-bug
git push origin main

git checkout staging  
git merge hotfix/critical-bug
git push origin staging

# Merger aussi en develop pour synchroniser
git checkout develop
git merge hotfix/critical-bug
git push origin develop
```

## 📊 Monitoring par Environnement

### Développement
- Logs détaillés
- Hot reload
- Debug activé

### Test
- Logs d'information
- Tests automatisés
- Monitoring basique

### Production
- Logs d'erreur uniquement
- Monitoring complet
- Alertes automatiques