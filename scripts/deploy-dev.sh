#!/bin/bash
# ===========================================
# SCRIPT DE DÉPLOIEMENT - DÉVELOPPEMENT
# ===========================================

set -e

echo "🚀 Déploiement en environnement de développement..."

# Charger les variables d'environnement de développement
export NODE_ENV=development
cp .env.development .env.local

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci

# Vérification de la base de données
echo "🗄️ Vérification de la connexion à la base de données..."
npm run test-env

# Exécution des migrations
echo "🔄 Exécution des migrations de base de données..."
npm run db:migrate

# Tests unitaires
echo "🧪 Exécution des tests..."
npm run test

# Build de l'application
echo "🏗️ Build de l'application..."
npm run build

# Démarrage du serveur de développement
echo "🌟 Démarrage du serveur de développement..."
npm run dev

echo "✅ Déploiement de développement terminé!"
echo "🌐 Application disponible sur: http://localhost:3000"