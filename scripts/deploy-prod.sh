#!/bin/bash
# ===========================================
# SCRIPT DE DÉPLOIEMENT - PRODUCTION
# ===========================================

set -e

echo "🚀 Déploiement en environnement de production..."

# Vérifications de sécurité
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ VERCEL_TOKEN non défini"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY non défini"
    exit 1
fi

# Charger les variables d'environnement de production
export NODE_ENV=production
cp .env.production .env.local

# Backup de la base de données avant déploiement
echo "💾 Backup de la base de données..."
npm run db:backup

# Installation des dépendances de production uniquement
echo "📦 Installation des dépendances de production..."
npm ci --only=production

# Vérification de la base de données
echo "🗄️ Vérification de la connexion à la base de données..."
npm run test-env

# Tests critiques uniquement
echo "🧪 Exécution des tests critiques..."
npm run test -- --testPathPattern="critical"

# Build optimisé pour la production
echo "🏗️ Build optimisé pour la production..."
npm run build

# Analyse de sécurité
echo "🔒 Analyse de sécurité..."
npm audit --audit-level moderate

# Déploiement sur Vercel (production)
echo "🚀 Déploiement en production..."
npx vercel --prod --token $VERCEL_TOKEN

# Tests de smoke post-déploiement
echo "🔍 Tests de smoke post-déploiement..."
curl -f https://loft-algerie.com/api/health || exit 1

# Notification de déploiement réussi
echo "📧 Notification de déploiement..."
npm run notify:deployment-success

echo "✅ Déploiement de production terminé!"
echo "🌐 Application disponible sur: https://loft-algerie.com"