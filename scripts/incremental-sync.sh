#!/bin/bash
# =====================================================
# SYNCHRONISATION INCRÉMENTALE
# =====================================================
# Pour mettre à jour seulement les données modifiées

TARGET_ENV="${1:-test}"
DAYS_BACK="${2:-7}"  # Synchroniser les 7 derniers jours par défaut

echo "🔄 SYNCHRONISATION INCRÉMENTALE (${DAYS_BACK} derniers jours)"
echo "=================================================="

# Configuration
PROD_DB="loft_prod"
TARGET_DB="loft_${TARGET_ENV}"

# Tables à synchroniser de manière incrémentale
TABLES=("lofts" "transactions" "tasks" "notifications")

for table in "${TABLES[@]}"; do
    echo "📊 Synchronisation de ${table}..."
    
    # Export des données récentes depuis PROD
    pg_dump -h localhost -U postgres -d "${PROD_DB}" \
        --data-only \
        --table="${table}" \
        --where="updated_at >= NOW() - INTERVAL '${DAYS_BACK} days'" \
        > "/tmp/${table}_recent.sql"
    
    # Suppression des données récentes dans TEST
    psql -h localhost -U postgres -d "${TARGET_DB}" \
        -c "DELETE FROM ${table} WHERE updated_at >= NOW() - INTERVAL '${DAYS_BACK} days';"
    
    # Import des nouvelles données
    psql -h localhost -U postgres -d "${TARGET_DB}" \
        < "/tmp/${table}_recent.sql"
    
    # Nettoyage
    rm "/tmp/${table}_recent.sql"
    
    echo "✅ ${table} synchronisé"
done

echo ""
echo "🎉 SYNCHRONISATION INCRÉMENTALE TERMINÉE"
echo "Données des ${DAYS_BACK} derniers jours mises à jour"