#!/bin/bash
# ===========================================
# CONFIGURATION DES BASES DE DONNÉES PAR ENVIRONNEMENT
# ===========================================

set -e

echo "🗄️ Configuration des bases de données pour tous les environnements..."

# Fonction pour configurer un environnement Supabase
setup_supabase_env() {
    local env_name=$1
    local project_ref=$2
    
    echo "📋 Configuration de l'environnement $env_name..."
    
    # Créer le projet Supabase si nécessaire
    supabase projects create "loft-algerie-$env_name" --region eu-west-1
    
    # Appliquer le schéma de base de données
    supabase db push --project-ref $project_ref
    
    # Exécuter les migrations
    for migration in scripts/*.sql; do
        if [ -f "$migration" ]; then
            echo "🔄 Exécution de la migration: $(basename $migration)"
            supabase db reset --project-ref $project_ref --file "$migration"
        fi
    done
    
    # Seed des données de base
    if [ "$env_name" != "production" ]; then
        echo "🌱 Insertion des données de test..."
        supabase db reset --project-ref $project_ref --file seed_data.sql
    fi
    
    echo "✅ Environnement $env_name configuré!"
}

# Configuration des environnements
echo "🏗️ Configuration de l'environnement de développement..."
setup_supabase_env "dev" "$DEV_PROJECT_REF"

echo "🧪 Configuration de l'environnement de test..."
setup_supabase_env "test" "$TEST_PROJECT_REF"

echo "🚀 Configuration de l'environnement de production..."
setup_supabase_env "prod" "$PROD_PROJECT_REF"

echo "✅ Tous les environnements de base de données sont configurés!"