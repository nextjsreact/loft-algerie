#!/bin/bash
# ===========================================
# CONFIGURATION DU WORKFLOW GIT
# ===========================================

echo "🚀 Configuration du workflow multi-environnements"

# Créer les branches principales
git checkout -b develop
git checkout -b staging  
git checkout -b main

# Configurer les branches par défaut
git checkout develop
echo "✅ Branche develop créée (développement)"

git checkout staging
echo "✅ Branche staging créée (test)"

git checkout main  
echo "✅ Branche main créée (production)"

# Retourner sur develop pour le travail quotidien
git checkout develop

echo ""
echo "📋 Branches configurées :"
echo "• develop  → Développement quotidien"
echo "• staging  → Tests et validation"  
echo "• main     → Production stable"
echo ""
echo "🎯 Vous êtes maintenant sur la branche 'develop'"
echo "Commencez à coder ici !"