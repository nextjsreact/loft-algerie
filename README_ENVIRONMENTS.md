# 🏗️ Configuration Multi-Environnements - Loft Algérie

## 📖 Vue d'ensemble

Ce projet est configuré avec **trois environnements distincts** selon les meilleures pratiques DevOps :

- 🔧 **Développement** : Pour le développement local
- 🧪 **Test/Staging** : Pour les tests d'intégration  
- 🚀 **Production** : Pour l'application en production

## 🎯 Démarrage Rapide

### Pour les débutants (RECOMMANDÉ)
```bash
# 1. Vérifier les prérequis (Windows)
scripts\check-prerequisites.bat

# 2. Guide interactif complet
npm run setup:guide
```

### Pour les développeurs expérimentés
```bash
# 1. Installation
npm install

# 2. Configuration rapide
npm run setup:first

# 3. Test de l'environnement
npm run test-env

# 4. Démarrage
npm run dev
```

## 📁 Structure des Environnements

```
📦 Projet
├── 🔧 DÉVELOPPEMENT
│   ├── .env.local (généré automatiquement)
│   ├── .env.development (template)
│   └── Base de données: loft-algerie-dev
│
├── 🧪 TEST/STAGING  
│   ├── .env.test (template)
│   └── Base de données: loft-algerie-test
│
└── 🚀 PRODUCTION
    ├── .env.production (template)
    └── Base de données: loft-algerie-prod
```

## 🛠️ Scripts Disponibles

### Configuration
| Script | Description |
|--------|-------------|
| `npm run setup:guide` | 🎯 Guide interactif complet |
| `npm run setup:first` | ⚡ Configuration rapide |
| `npm run test-env` | 🧪 Test de l'environnement |
| `npm run health:check` | 🏥 Vérification de santé |

### Développement
| Script | Description |
|--------|-------------|
| `npm run dev` | 🔧 Serveur de développement |
| `npm run build` | 🏗️ Build de l'application |
| `npm run test` | 🧪 Tests unitaires |
| `npm run lint` | 🔍 Vérification du code |

### Environnements
| Script | Description |
|--------|-------------|
| `npm run env:switch:dev` | 🔄 Basculer vers développement |
| `npm run env:switch:test` | 🔄 Basculer vers test |
| `npm run env:switch:prod` | 🔄 Basculer vers production |

### Déploiement
| Script | Description |
|--------|-------------|
| `npm run deploy:dev` | 🚀 Déployer en développement |
| `npm run deploy:test` | 🚀 Déployer en test |
| `npm run deploy:prod` | 🚀 Déployer en production |

## 🔧 Configuration Détaillée

### 1. Environnement de Développement

**Objectif** : Développement local avec hot reload et logs détaillés

**Configuration** :
- Base de données : Projet Supabase dédié
- URL : `http://localhost:3000`
- Logs : Niveau debug
- Tests : Tous les tests

**Démarrage** :
```bash
npm run env:switch:dev
npm run dev
```

### 2. Environnement de Test

**Objectif** : Tests d'intégration et validation avant production

**Configuration** :
- Base de données : Projet Supabase de staging
- URL : `https://test-loft-algerie.vercel.app`
- Tests : Tests complets + E2E
- Monitoring : Limité

**Démarrage** :
```bash
npm run env:switch:test
npm run deploy:test
```

### 3. Environnement de Production

**Objectif** : Application en production avec optimisations maximales

**Configuration** :
- Base de données : Projet Supabase de production
- URL : `https://loft-algerie.com`
- Optimisations : Maximales
- Monitoring : Complet
- Sécurité : Renforcée

**Démarrage** :
```bash
npm run env:switch:prod
npm run deploy:prod
```

## 🗄️ Configuration des Bases de Données

### Création des Projets Supabase

1. **Développement**
   - Nom : `loft-algerie-dev`
   - Région : Europe West (Ireland)
   - Usage : Développement local

2. **Test**
   - Nom : `loft-algerie-test`
   - Région : Europe West (Ireland)
   - Usage : Tests et staging

3. **Production**
   - Nom : `loft-algerie-prod`
   - Région : Europe West (Ireland)
   - Usage : Production

### Application du Schéma

Pour chaque environnement :
1. Ouvrez le dashboard Supabase
2. Allez dans "SQL Editor"
3. Copiez le contenu de `schema.sql`
4. Exécutez le script

## 🔐 Variables d'Environnement

### Variables Requises

Chaque environnement nécessite :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Authentication
AUTH_SECRET=[32-character-secret]

# Application
NEXT_PUBLIC_APP_URL=[app-url]
NODE_ENV=[environment]
```

### Sécurité

- ❌ **Jamais** de secrets dans le code
- ✅ Variables spécifiques par environnement
- ✅ Fichiers `.env.*` dans `.gitignore`
- ✅ Secrets GitHub pour le CI/CD

## 🚀 CI/CD avec GitHub Actions

### Branches et Déploiements

```
develop  → Déploiement automatique en développement
staging  → Déploiement automatique en test
main     → Déploiement automatique en production
```

### Configuration

1. **Secrets GitHub** : Configurez les variables dans Settings > Secrets
2. **Branches protégées** : Activez la protection sur `main`
3. **Reviews** : Exigez des reviews pour `main`

## 🏥 Monitoring et Santé

### Vérification de Santé

```bash
# Local
npm run health:check

# API
curl http://localhost:3000/api/health
```

### Logs par Environnement

- **Développement** : Console détaillée
- **Test** : Logs d'information
- **Production** : Logs d'erreur uniquement

## 🆘 Dépannage

### Problèmes Courants

1. **Variables d'environnement manquantes**
   ```bash
   npm run test-env
   ```

2. **Erreur de connexion à la base de données**
   - Vérifiez les clés Supabase
   - Vérifiez que le schéma est appliqué

3. **Erreur de build**
   ```bash
   npm run build -- --debug
   ```

### Support

1. ✅ Consultez `QUICK_START.md`
2. ✅ Exécutez `npm run health:check`
3. ✅ Vérifiez les logs de l'environnement
4. ✅ Consultez la documentation Supabase

## 📚 Documentation

- 📖 [Guide de Démarrage Rapide](QUICK_START.md)
- 🚀 [Guide de Déploiement](DEPLOYMENT_GUIDE.md)
- 🏗️ [Architecture des Environnements](README_ENVIRONMENTS.md)

## 🎯 Prochaines Étapes

1. **Configurez votre environnement de développement** avec `npm run setup:guide`
2. **Testez votre application** avec `npm run dev`
3. **Configurez les environnements de test et production**
4. **Mettez en place le CI/CD** avec GitHub Actions
5. **Configurez le monitoring** et les alertes

---

**🎉 Bon développement avec votre architecture multi-environnements !**