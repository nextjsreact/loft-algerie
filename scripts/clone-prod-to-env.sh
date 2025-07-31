#!/bin/bash
# =====================================================
# CLONAGE AUTOMATISÉ PROD → TEST/DEV
# =====================================================
# Script principal pour cloner PROD vers un environnement

set -e  # Arrêter en cas d'erreur

# Configuration (à adapter selon votre environnement)
PROD_HOST="${PROD_HOST:-localhost}"
PROD_DB="${PROD_DB:-loft_prod}"
PROD_USER="${PROD_USER:-postgres}"

TARGET_ENV="${1:-test}"  # test ou dev
TARGET_HOST="${TARGET_HOST:-localhost}"
TARGET_DB="${TARGET_DB:-loft_${TARGET_ENV}}"
TARGET_USER="${TARGET_USER:-postgres}"

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/prod_clone_${TIMESTAMP}.sql"

echo "🚀 DÉBUT DU CLONAGE PROD → ${TARGET_ENV^^}"
echo "=================================================="
echo "Source: ${PROD_HOST}/${PROD_DB}"
echo "Cible: ${TARGET_HOST}/${TARGET_DB}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Créer le dossier de sauvegarde
mkdir -p "${BACKUP_DIR}"

# ÉTAPE 1: Sauvegarde de sécurité de l'environnement cible
echo "📦 ÉTAPE 1: Sauvegarde de sécurité de ${TARGET_ENV^^}..."
pg_dump -h "${TARGET_HOST}" -U "${TARGET_USER}" -d "${TARGET_DB}" \
    --no-owner --no-privileges \
    > "${BACKUP_DIR}/${TARGET_ENV}_backup_${TIMESTAMP}.sql"
echo "✅ Sauvegarde créée: ${TARGET_ENV}_backup_${TIMESTAMP}.sql"

# ÉTAPE 2: Export de la structure depuis PROD
echo "📤 ÉTAPE 2: Export de la structure depuis PROD..."
pg_dump -h "${PROD_HOST}" -U "${PROD_USER}" -d "${PROD_DB}" \
    --schema-only \
    --no-owner --no-privileges \
    > "${BACKUP_DIR}/prod_schema_${TIMESTAMP}.sql"
echo "✅ Structure exportée"

# ÉTAPE 3: Export des données essentielles (sans données sensibles)
echo "📤 ÉTAPE 3: Export des données essentielles..."
pg_dump -h "${PROD_HOST}" -U "${PROD_USER}" -d "${PROD_DB}" \
    --data-only \
    --no-owner --no-privileges \
    --exclude-table=auth.users \
    --exclude-table=auth.sessions \
    --exclude-table=auth.refresh_tokens \
    --exclude-table=profiles \
    --exclude-table=user_sessions \
    --exclude-table=notifications \
    --exclude-table=messages \
    > "${BACKUP_DIR}/prod_data_${TIMESTAMP}.sql"
echo "✅ Données essentielles exportées (sans données sensibles)"

# ÉTAPE 4: Nettoyage de l'environnement cible
echo "🧹 ÉTAPE 4: Nettoyage de ${TARGET_ENV^^}..."
psql -h "${TARGET_HOST}" -U "${TARGET_USER}" -d "${TARGET_DB}" \
    -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
psql -h "${TARGET_HOST}" -U "${TARGET_USER}" -d "${TARGET_DB}" \
    -c "DROP SCHEMA IF EXISTS auth CASCADE;"
echo "✅ Environnement nettoyé"

# ÉTAPE 5: Import de la structure
echo "📥 ÉTAPE 5: Import de la structure..."
psql -h "${TARGET_HOST}" -U "${TARGET_USER}" -d "${TARGET_DB}" \
    < "${BACKUP_DIR}/prod_schema_${TIMESTAMP}.sql"
echo "✅ Structure importée"

# ÉTAPE 6: Import des données essentielles
echo "📥 ÉTAPE 6: Import des données essentielles..."
psql -h "${TARGET_HOST}" -U "${TARGET_USER}" -d "${TARGET_DB}" \
    < "${BACKUP_DIR}/prod_data_${TIMESTAMP}.sql"
echo "✅ Données importées"

# ÉTAPE 7: Post-traitement (utilisateurs de test)
echo "👥 ÉTAPE 7: Création des utilisateurs de test..."
psql -h "${TARGET_HOST}" -U "${TARGET_USER}" -d "${TARGET_DB}" \
    < scripts/create-test-users.sql
echo "✅ Utilisateurs de test créés"

# ÉTAPE 8: Vérification automatique
echo "🔍 ÉTAPE 8: Vérification de la synchronisation..."
VERIFICATION_RESULT=$(psql -h "${TARGET_HOST}" -U "${TARGET_USER}" -d "${TARGET_DB}" \
    -t -c "SELECT json_build_object(
        'profiles', (SELECT COUNT(*) FROM profiles),
        'lofts', (SELECT COUNT(*) FROM lofts),
        'users', (SELECT COUNT(*) FROM auth.users),
        'transactions', (SELECT COUNT(*) FROM transactions)
    );" | tr -d ' \n')

echo "📊 Résultats de vérification:"
echo "${VERIFICATION_RESULT}" | python3 -m json.tool

# ÉTAPE 9: Génération du rapport
echo "📋 ÉTAPE 9: Génération du rapport..."
cat > "${BACKUP_DIR}/clone_report_${TIMESTAMP}.md" << EOF
# Rapport de Clonage PROD → ${TARGET_ENV^^}

**Date:** $(date)
**Durée:** $SECONDS secondes

## Environnements
- **Source:** ${PROD_HOST}/${PROD_DB}
- **Cible:** ${TARGET_HOST}/${TARGET_DB}

## Données clonées
${VERIFICATION_RESULT}

## Fichiers générés
- Sauvegarde: ${TARGET_ENV}_backup_${TIMESTAMP}.sql
- Structure: prod_schema_${TIMESTAMP}.sql  
- Données: prod_data_${TIMESTAMP}.sql
- Rapport: clone_report_${TIMESTAMP}.md

## Utilisateurs de test créés
- admin@test.local (Admin)
- manager@test.local (Manager)
- user@test.local (Utilisateur)
- Mot de passe: test123

## Status
✅ Clonage réussi - Environnement ${TARGET_ENV^^} prêt pour le développement
EOF

echo "✅ Rapport généré: clone_report_${TIMESTAMP}.md"

# ÉTAPE 10: Nettoyage optionnel
if [[ "${CLEANUP:-yes}" == "yes" ]]; then
    echo "🧹 ÉTAPE 10: Nettoyage des fichiers temporaires..."
    # Garder seulement les 5 dernières sauvegardes
    ls -t "${BACKUP_DIR}"/prod_*.sql | tail -n +6 | xargs -r rm
    echo "✅ Nettoyage terminé"
fi

echo ""
echo "🎉 CLONAGE TERMINÉ AVEC SUCCÈS!"
echo "=================================================="
echo "Environnement ${TARGET_ENV^^} prêt pour le développement"
echo "Durée totale: $SECONDS secondes"
echo "Rapport: ${BACKUP_DIR}/clone_report_${TIMESTAMP}.md"
echo ""
echo "🔐 Connexion de test:"
echo "Email: admin@test.local"
echo "Mot de passe: test123"