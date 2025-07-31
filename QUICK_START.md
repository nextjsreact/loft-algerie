# 🚀 Guide de Démarrage Rapide

## Bienvenue dans votre projet Loft Algérie Multi-Environnements !

Ce guide vous accompagne pas à pas pour configurer votre premier environnement de développement.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ **Node.js 18+** installé ([Télécharger](https://nodejs.org))
- ✅ **Un compte Supabase** ([Créer un compte](https://supabase.com))
- ✅ **Git** installé (optionnel)

### Vérification rapide des prérequis (Windows)
```bash
scripts\check-prerequisites.bat
```

## 🎯 Étapes de Configuration

### 1. Vérification des prérequis
```bash
# Vérifier Node.js
node --version

# Vérifier npm
npm --version
```

### 2. Installation des dépendances
```bash
npm install
```

### 3. Configuration guidée (RECOMMANDÉ)
```bash
npm run setup:guide
```

Ce script interactif vous guidera à travers :
- ✅ Création du projet Supabase
- ✅ Configuration des variables d'environnement
- ✅ Application du schéma de base de données
- ✅ Test de la connexion
- ✅ Démarrage du serveur de développement

### 4. Configuration manuelle (Alternative)

Si vous préférez configurer manuellement :

#### A. Créer un projet Supabase
1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Cliquez sur "New project"
3. Nom : `loft-algerie-dev`
4. Région : `Europe West (Ireland)`
5. Créez le projet

#### B. Récupérer les clés
Dans Settings > API, copiez :
- Project URL
- anon/public key
- service_role key

#### C. Configurer l'environnement
```bash
npm run setup:first
```

#### D. Appliquer le schéma de base de données
1. Ouvrez votre dashboard Supabase
2. Allez dans "SQL Editor"
3. Copiez le contenu de `schema.sql`
4. Exécutez le script

## 🧪 Test de votre Configuration

### Tester la connexion à la base de données
```bash
npm run test-env
```

### Vérifier la santé de l'application
```bash
npm run health:check
```

## 🚀 Démarrage du Serveur de Développement

```bash
npm run dev
```

Votre application sera disponible sur : **http://localhost:3000**

## 📁 Structure des Fichiers de Configuration

```
├── .env.local              # Configuration locale (créé automatiquement)
├── .env.development        # Template pour le développement
├── .env.test              # Template pour les tests
├── .env.production        # Template pour la production
├── schema.sql             # Schéma de base de données
└── scripts/
    ├── setup-first-environment.js
    ├── step-by-step-guide.js
    └── check-prerequisites.bat
```

## 🔧 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer le serveur de développement |
| `npm run build` | Builder l'application |
| `npm run test` | Exécuter les tests |
| `npm run test-env` | Tester la connexion DB |
| `npm run health:check` | Vérifier la santé de l'app |
| `npm run setup:guide` | Guide de configuration interactif |

## 🆘 Dépannage

### Problème de connexion à la base de données
```bash
npm run test-env
```

### Variables d'environnement manquantes
Vérifiez que `.env.local` existe et contient :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`

### Erreur de build
```bash
npm run build -- --debug
```

## 📞 Support

Si vous rencontrez des problèmes :

1. ✅ Vérifiez les logs dans la console
2. ✅ Exécutez `npm run health:check`
3. ✅ Consultez la documentation Supabase
4. ✅ Vérifiez que toutes les variables d'environnement sont définies

## 🎯 Prochaines Étapes

Une fois votre environnement de développement fonctionnel :

1. **Configurez l'environnement de test** avec un nouveau projet Supabase
2. **Configurez l'environnement de production** avec un projet Supabase dédié
3. **Mettez en place le CI/CD** avec GitHub Actions
4. **Configurez le monitoring** et les alertes

---

**🎉 Félicitations ! Vous êtes prêt à développer votre application Loft Algérie !**