#!/bin/bash
# ===========================================
# SCRIPT DE DÉPLOIEMENT - TEST/STAGING
# ===========================================

set -e

echo "🚀 Déploiement en environnement de test..."

# Charger les variables d'environnement de test
export NODE_ENV=test
cp .env.test .env.local

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci --only=production

# Vérification de la base de données
echo "🗄️ Vérification de la connexion à la base de données..."
npm run test-env

# Exécution des migrations
echo "🔄 Exécution des migrations de base de données..."
npm run db:migrate

# Tests complets
echo "🧪 Exécution des tests complets..."
npm run test
npm run test:coverage

# Build optimisé
echo "🏗️ Build optimisé pour les tests..."
npm run build

# Tests E2E (si configurés)
if [ "$ENABLE_E2E_TESTS" = "true" ]; then
    echo "🎭 Exécution des tests E2E..."
    npx playwright test
fi

# Déploiement sur Vercel (branche staging)
echo "🚀 Déploiement sur Vercel..."
npx vercel --prod --token $VERCEL_TOKEN

echo "✅ Déploiement de test terminé!"
echo "🌐 Application disponible sur: https://test-loft-algerie.vercel.app"