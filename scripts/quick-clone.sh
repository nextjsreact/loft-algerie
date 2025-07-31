#!/bin/bash
# =====================================================
# CLONAGE RAPIDE POUR LE DÉVELOPPEMENT QUOTIDIEN
# =====================================================
# Version simplifiée pour usage fréquent

TARGET_ENV="${1:-test}"

echo "⚡ CLONAGE RAPIDE PROD → ${TARGET_ENV^^}"
echo "======================================"

# Configuration rapide (à adapter)
export PROD_HOST="your-prod-host"
export PROD_DB="loft_prod"
export TARGET_DB="loft_${TARGET_ENV}"

# Vérification des prérequis
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump non trouvé. Installez PostgreSQL client."
    exit 1
fi

# Clonage avec le script principal
./scripts/clone-prod-to-env.sh "${TARGET_ENV}"

# Vérification rapide
echo ""
echo "🔍 VÉRIFICATION RAPIDE:"
psql -h localhost -U postgres -d "${TARGET_DB}" \
    -c "SELECT 
        'Profiles: ' || COUNT(*) FROM profiles
        UNION ALL
        SELECT 'Lofts: ' || COUNT(*) FROM lofts
        UNION ALL  
        SELECT 'Users: ' || COUNT(*) FROM auth.users;"

echo ""
echo "✅ Environnement ${TARGET_ENV^^} prêt!"
echo "🔗 Connectez-vous avec admin@test.local / test123"