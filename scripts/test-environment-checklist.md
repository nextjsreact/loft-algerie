# ✅ Checklist - Configuration Environnement de Test

## 📋 Avant de Commencer

- [ ] ✅ Environnement de développement fonctionnel
- [ ] ✅ Compte Supabase actif
- [ ] ✅ Accès à Vercel (optionnel pour déploiement)
- [ ] ✅ Git configuré avec branches

## 🗄️ Configuration Supabase Test

### Étape 1: Création du Projet
- [ ] Aller sur https://supabase.com/dashboard
- [ ] Cliquer sur "New project"
- [ ] Nom: `loft-algerie-test`
- [ ] Région: `Europe West (Ireland)`
- [ ] Attendre l'initialisation complète

### Étape 2: Récupération des Clés
- [ ] Aller dans Settings > API
- [ ] Copier Project URL
- [ ] Copier anon/public key
- [ ] Copier service_role key

### Étape 3: Application du Schéma
- [ ] Ouvrir SQL Editor
- [ ] Copier le contenu de `scripts/schema-supabase-safe.sql`
- [ ] Exécuter le script
- [ ] Vérifier qu'il n'y a pas d'erreurs

### Étape 4: Données de Test (Optionnel)
- [ ] Copier le contenu de `scripts/seed-test-data.sql`
- [ ] Exécuter le script
- [ ] Vérifier que les données sont créées

## ⚙️ Configuration Locale

### Étape 5: Variables d'Environnement
- [ ] Exécuter `npm run setup:test-env`
- [ ] Suivre le guide interactif
- [ ] Vérifier que `.env.test` est créé

### Étape 6: Test de Connexion
- [ ] Exécuter `npm run env:switch:test`
- [ ] Exécuter `npm run test-env`
- [ ] Vérifier la connexion à la base de test

## 🚀 Déploiement (Optionnel)

### Étape 7: Configuration Vercel
- [ ] Créer un projet sur Vercel
- [ ] Connecter au repository GitHub
- [ ] Configurer les variables d'environnement depuis `.env.test`
- [ ] Configurer le déploiement sur branche `staging`

### Étape 8: Test du Déploiement
- [ ] Créer la branche `staging`
- [ ] Push du code
- [ ] Vérifier le déploiement automatique
- [ ] Tester l'application déployée

## 🧪 Validation Finale

### Étape 9: Tests Fonctionnels
- [ ] Connexion à l'application de test
- [ ] Création d'un loft de test
- [ ] Modification d'un loft
- [ ] Vérification des alertes de facturation
- [ ] Test des notifications

### Étape 10: Nettoyage
- [ ] Retourner à l'environnement de développement
- [ ] Exécuter `npm run env:switch:dev`
- [ ] Vérifier que le développement fonctionne toujours

## 📝 Commandes Utiles

```bash
# Configuration
npm run setup:test-env          # Guide interactif complet

# Basculement d'environnements
npm run env:switch:test         # Basculer vers test
npm run env:switch:dev          # Retourner au développement

# Tests et vérifications
npm run test-env               # Tester la connexion DB
npm run health:check           # Vérifier la santé de l'app
npm run test:tv-feature        # Tester la fonctionnalité TV

# Déploiement
npm run deploy:test            # Déployer en test (si configuré)
```

## 🆘 Dépannage

### Problèmes Courants

1. **Erreur de connexion Supabase**
   - Vérifier les clés dans `.env.test`
   - Vérifier que le projet est bien initialisé

2. **Schéma non appliqué**
   - Vérifier qu'il n'y a pas d'erreurs SQL
   - Réessayer avec `scripts/schema-supabase-safe.sql`

3. **Variables d'environnement**
   - Vérifier que `.env.test` existe
   - Vérifier que `npm run env:switch:test` a été exécuté

4. **Données de test manquantes**
   - Exécuter `scripts/seed-test-data.sql`
   - Vérifier les logs pour les erreurs

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez cette checklist
2. Consultez les logs d'erreur
3. Testez étape par étape
4. Vérifiez la documentation Supabase

---

**🎯 Une fois cette checklist complétée, votre environnement de test sera opérationnel !**