# Guide de Déploiement Multi-Environnements

## Vue d'ensemble

Ce guide décrit la procédure de déploiement de l'application Loft Algérie sur trois environnements distincts :

- **Développement** : Pour le développement local et les tests rapides
- **Test/Staging** : Pour les tests d'intégration et la validation
- **Production** : Pour l'application en production

## Architecture des Environnements

```
┌─────────────────────────────────────────────────────────────┐
│                    ENVIRONNEMENTS                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│  DÉVELOPPEMENT  │      TEST       │      PRODUCTION         │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • localhost:3000│ • test.domain   │ • loft-algerie.com      │
│ • Base locale   │ • Base staging  │ • Base production       │
│ • Logs détaillés│ • Tests auto    │ • Monitoring complet    │
│ • Hot reload    │ • E2E tests     │ • Optimisations         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Prérequis

### Outils nécessaires
- Node.js 18+
- npm ou yarn
- Supabase CLI
- Vercel CLI
- Git

### Variables d'environnement
Chaque environnement nécessite ses propres variables :

1. **Développement** : `.env.development`
2. **Test** : `.env.test`
3. **Production** : `.env.production`

## Procédures de Déploiement

### 1. Environnement de Développement

```bash
# Basculer vers l'environnement de développement
npm run env:switch:dev

# Déployer en développement
npm run deploy:dev
```

**Ou manuellement :**
```bash
# Installer les dépendances
npm install

# Exécuter les migrations
npm run db:migrate

# Démarrer le serveur de développement
npm run dev
```

### 2. Environnement de Test

```bash
# Basculer vers l'environnement de test
npm run env:switch:test

# Déployer en test
npm run deploy:test
```

**Vérifications automatiques :**
- Tests unitaires
- Tests d'intégration
- Tests E2E (si configurés)
- Vérification de la base de données

### 3. Environnement de Production

```bash
# Basculer vers l'environnement de production
npm run env:switch:prod

# Déployer en production (avec vérifications)
npm run deploy:prod
```

**Vérifications de sécurité :**
- Backup automatique de la base de données
- Tests critiques uniquement
- Analyse de sécurité
- Tests de smoke post-déploiement

## Configuration des Bases de Données

### Création des projets Supabase

1. **Développement**
   ```bash
   supabase projects create loft-algerie-dev --region eu-west-1
   ```

2. **Test**
   ```bash
   supabase projects create loft-algerie-test --region eu-west-1
   ```

3. **Production**
   ```bash
   supabase projects create loft-algerie-prod --region eu-west-1
   ```

### Application du schéma

```bash
# Pour tous les environnements
bash scripts/setup-database-environments.sh
```

## CI/CD avec GitHub Actions

### Branches et Déploiements

- `develop` → Déploiement automatique en développement
- `staging` → Déploiement automatique en test
- `main` → Déploiement automatique en production

### Configuration des Secrets GitHub

Dans les paramètres du repository GitHub, ajouter :

```
VERCEL_TOKEN=your_vercel_token
DEV_DATABASE_URL=your_dev_database_url
DEV_SUPABASE_URL=your_dev_supabase_url
DEV_SUPABASE_ANON_KEY=your_dev_anon_key
TEST_DATABASE_URL=your_test_database_url
TEST_SUPABASE_URL=your_test_supabase_url
TEST_SUPABASE_ANON_KEY=your_test_anon_key
PROD_DATABASE_URL=your_prod_database_url
PROD_SUPABASE_URL=your_prod_supabase_url
PROD_SUPABASE_ANON_KEY=your_prod_anon_key
PROD_SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
```

## Monitoring et Maintenance

### Vérification de Santé

```bash
# Vérifier la santé de l'application
npm run health:check
```

### Backup et Restauration

```bash
# Backup de la base de données
npm run db:backup

# Restauration de la base de données
npm run db:restore
```

### Logs et Monitoring

- **Développement** : Logs détaillés dans la console
- **Test** : Logs d'information avec Sentry
- **Production** : Logs d'erreur uniquement avec monitoring complet

## Bonnes Pratiques

### Sécurité
1. Jamais de secrets dans le code
2. Variables d'environnement spécifiques par environnement
3. Backup automatique avant déploiement en production
4. Tests de sécurité automatisés

### Performance
1. Build optimisé pour la production
2. Cache activé en test et production
3. CDN pour les assets statiques
4. Compression activée

### Qualité
1. Tests obligatoires avant déploiement
2. Linting automatique
3. Coverage de code
4. Tests E2E en staging

## Dépannage

### Problèmes Courants

1. **Erreur de connexion à la base de données**
   ```bash
   npm run test-env
   ```

2. **Échec des migrations**
   ```bash
   npm run db:migrate:supabase
   ```

3. **Problème de build**
   ```bash
   npm run build -- --debug
   ```

### Support

Pour toute question ou problème :
1. Vérifier les logs de l'environnement concerné
2. Exécuter le health check
3. Consulter la documentation Supabase/Vercel
4. Contacter l'équipe de développement

## Checklist de Déploiement

### Avant le déploiement
- [ ] Tests passent localement
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] Documentation mise à jour

### Après le déploiement
- [ ] Health check réussi
- [ ] Tests de smoke passent
- [ ] Monitoring actif
- [ ] Équipe notifiée