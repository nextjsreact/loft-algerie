#!/bin/bash
# =====================================================
# EXPORT RAPIDE DES DONNÉES DEPUIS PROD
# =====================================================

# Configuration (à adapter)
PROD_HOST="your-prod-host"
PROD_DB="your-prod-db"
PROD_USER="your-user"
TEST_HOST="your-test-host"
TEST_DB="your-test-db"
TEST_USER="your-user"

echo "🚀 Export des données essentielles depuis PROD..."

# 1. Export des données de configuration
pg_dump -h $PROD_HOST -U $PROD_USER -d $PROD_DB \
  --data-only \
  --table=currencies \
  --table=categories \
  --table=zone_areas \
  --table=internet_connection_types \
  --table=payment_methods \
  > config_data.sql

echo "✅ Données de configuration exportées"

# 2. Export des données de base (anonymisées)
pg_dump -h $PROD_HOST -U $PROD_USER -d $PROD_DB \
  --data-only \
  --table=loft_owners \
  --table=lofts \
  > base_data.sql

echo "✅ Données de base exportées"

# 3. Import vers TEST
echo "📥 Import vers TEST..."

psql -h $TEST_HOST -U $TEST_USER -d $TEST_DB < config_data.sql
psql -h $TEST_HOST -U $TEST_USER -d $TEST_DB < base_data.sql

echo "🎉 Migration terminée!"
echo "Exécutez check-data-differences.sql pour vérifier"

# Nettoyage
rm config_data.sql base_data.sql