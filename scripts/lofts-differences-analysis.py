#!/usr/bin/env python3
"""
Analyse des différences dans la table lofts entre PROD et TEST
"""

# Données PROD
prod_columns = [
    {"ordinal_position": 1, "column_name": "id", "data_type": "uuid"},
    {"ordinal_position": 2, "column_name": "name", "data_type": "character varying"},
    {"ordinal_position": 3, "column_name": "description", "data_type": "text"},
    {"ordinal_position": 4, "column_name": "address", "data_type": "text"},
    {"ordinal_position": 5, "column_name": "price_per_month", "data_type": "numeric"},
    {"ordinal_position": 6, "column_name": "status", "data_type": "USER-DEFINED"},
    {"ordinal_position": 7, "column_name": "owner_id", "data_type": "uuid"},
    {"ordinal_position": 8, "column_name": "company_percentage", "data_type": "numeric"},
    {"ordinal_position": 9, "column_name": "owner_percentage", "data_type": "numeric"},
    {"ordinal_position": 10, "column_name": "created_at", "data_type": "timestamp with time zone"},
    {"ordinal_position": 11, "column_name": "updated_at", "data_type": "timestamp with time zone"},
    {"ordinal_position": 12, "column_name": "zone_area_id", "data_type": "uuid"},
    {"ordinal_position": 13, "column_name": "airbnb_listing_id", "data_type": "text"},
    {"ordinal_position": 14, "column_name": "internet_connection_type_id", "data_type": "uuid"},
    {"ordinal_position": 15, "column_name": "water_customer_code", "data_type": "text"},
    {"ordinal_position": 16, "column_name": "water_contract_code", "data_type": "text"},
    {"ordinal_position": 17, "column_name": "water_meter_number", "data_type": "text"},
    {"ordinal_position": 18, "column_name": "water_correspondent", "data_type": "text"},
    {"ordinal_position": 19, "column_name": "electricity_pdl_ref", "data_type": "text"},
    {"ordinal_position": 20, "column_name": "electricity_customer_number", "data_type": "text"},
    {"ordinal_position": 21, "column_name": "electricity_meter_number", "data_type": "text"},
    {"ordinal_position": 22, "column_name": "electricity_correspondent", "data_type": "text"},
    {"ordinal_position": 23, "column_name": "gas_pdl_ref", "data_type": "text"},
    {"ordinal_position": 24, "column_name": "gas_customer_number", "data_type": "text"},
    {"ordinal_position": 25, "column_name": "gas_meter_number", "data_type": "text"},
    {"ordinal_position": 26, "column_name": "gas_correspondent", "data_type": "text"},
    {"ordinal_position": 27, "column_name": "phone_number", "data_type": "text"},
    {"ordinal_position": 28, "column_name": "frequence_paiement_eau", "data_type": "character varying"},
    {"ordinal_position": 29, "column_name": "prochaine_echeance_eau", "data_type": "date"},
    {"ordinal_position": 30, "column_name": "frequence_paiement_energie", "data_type": "character varying"},
    {"ordinal_position": 31, "column_name": "prochaine_echeance_energie", "data_type": "date"},
    {"ordinal_position": 34, "column_name": "frequence_paiement_telephone", "data_type": "character varying"},
    {"ordinal_position": 35, "column_name": "prochaine_echeance_telephone", "data_type": "date"},
    {"ordinal_position": 36, "column_name": "frequence_paiement_internet", "data_type": "character varying"},
    {"ordinal_position": 37, "column_name": "prochaine_echeance_internet", "data_type": "date"},
    {"ordinal_position": 38, "column_name": "price_per_night", "data_type": "numeric"},
    {"ordinal_position": 39, "column_name": "frequence_paiement_tv", "data_type": "character varying"},
    {"ordinal_position": 40, "column_name": "prochaine_echeance_tv", "data_type": "date"}
]

# Données TEST
test_columns = [
    {"ordinal_position": 1, "column_name": "id", "data_type": "uuid"},
    {"ordinal_position": 2, "column_name": "name", "data_type": "character varying"},
    {"ordinal_position": 3, "column_name": "description", "data_type": "text"},
    {"ordinal_position": 4, "column_name": "address", "data_type": "text"},
    {"ordinal_position": 5, "column_name": "price_per_month", "data_type": "numeric"},
    {"ordinal_position": 6, "column_name": "status", "data_type": "USER-DEFINED"},
    {"ordinal_position": 7, "column_name": "owner_id", "data_type": "uuid"},
    {"ordinal_position": 8, "column_name": "company_percentage", "data_type": "numeric"},
    {"ordinal_position": 9, "column_name": "owner_percentage", "data_type": "numeric"},
    {"ordinal_position": 10, "column_name": "zone_area_id", "data_type": "uuid"},
    {"ordinal_position": 11, "column_name": "internet_connection_type_id", "data_type": "uuid"},
    {"ordinal_position": 12, "column_name": "airbnb_listing_id", "data_type": "text"},
    {"ordinal_position": 13, "column_name": "water_customer_code", "data_type": "text"},
    {"ordinal_position": 14, "column_name": "water_contract_code", "data_type": "text"},
    {"ordinal_position": 15, "column_name": "water_meter_number", "data_type": "text"},
    {"ordinal_position": 16, "column_name": "water_correspondent", "data_type": "text"},
    {"ordinal_position": 17, "column_name": "electricity_pdl_ref", "data_type": "text"},
    {"ordinal_position": 18, "column_name": "electricity_customer_number", "data_type": "text"},
    {"ordinal_position": 19, "column_name": "electricity_meter_number", "data_type": "text"},
    {"ordinal_position": 20, "column_name": "electricity_correspondent", "data_type": "text"},
    {"ordinal_position": 21, "column_name": "gas_pdl_ref", "data_type": "text"},
    {"ordinal_position": 22, "column_name": "gas_customer_number", "data_type": "text"},
    {"ordinal_position": 23, "column_name": "gas_meter_number", "data_type": "text"},
    {"ordinal_position": 24, "column_name": "gas_correspondent", "data_type": "text"},
    {"ordinal_position": 25, "column_name": "phone_number", "data_type": "text"},
    {"ordinal_position": 26, "column_name": "frequence_paiement_eau", "data_type": "character varying"},
    {"ordinal_position": 27, "column_name": "prochaine_echeance_eau", "data_type": "date"},
    {"ordinal_position": 28, "column_name": "frequence_paiement_energie", "data_type": "character varying"},
    {"ordinal_position": 29, "column_name": "prochaine_echeance_energie", "data_type": "date"},
    {"ordinal_position": 30, "column_name": "frequence_paiement_telephone", "data_type": "character varying"},
    {"ordinal_position": 31, "column_name": "prochaine_echeance_telephone", "data_type": "date"},
    {"ordinal_position": 32, "column_name": "frequence_paiement_internet", "data_type": "character varying"},
    {"ordinal_position": 33, "column_name": "prochaine_echeance_internet", "data_type": "date"},
    {"ordinal_position": 34, "column_name": "frequence_paiement_tv", "data_type": "character varying"},
    {"ordinal_position": 35, "column_name": "prochaine_echeance_tv", "data_type": "date"},
    {"ordinal_position": 36, "column_name": "created_at", "data_type": "timestamp with time zone"},
    {"ordinal_position": 37, "column_name": "updated_at", "data_type": "timestamp with time zone"}
]

def analyze_differences():
    print("=" * 70)
    print("ANALYSE DES DIFFÉRENCES - TABLE LOFTS")
    print("=" * 70)
    
    # Extraire les noms de colonnes
    prod_cols = {col['column_name'] for col in prod_columns}
    test_cols = {col['column_name'] for col in test_columns}
    
    # Trouver les différences
    missing_in_test = prod_cols - test_cols
    extra_in_test = test_cols - prod_cols
    
    print(f"\n📊 RÉSUMÉ:")
    print(f"• Colonnes en PROD: {len(prod_cols)}")
    print(f"• Colonnes en TEST: {len(test_cols)}")
    print(f"• Différence: {len(prod_cols) - len(test_cols)} colonnes")
    
    if missing_in_test:
        print(f"\n🚨 COLONNES MANQUANTES DANS TEST ({len(missing_in_test)}):")
        for col in sorted(missing_in_test):
            print(f"  - {col}")
    
    if extra_in_test:
        print(f"\n➕ COLONNES EN PLUS DANS TEST ({len(extra_in_test)}):")
        for col in sorted(extra_in_test):
            print(f"  - {col}")
    
    # Vérification spéciale des colonnes TV
    tv_columns = ['frequence_paiement_tv', 'prochaine_echeance_tv']
    print(f"\n📺 VÉRIFICATION COLONNES TV:")
    for col in tv_columns:
        prod_has = col in prod_cols
        test_has = col in test_cols
        status = "✅" if prod_has and test_has else "❌" if not test_has else "⚠️"
        print(f"  {status} {col}: PROD({prod_has}) | TEST({test_has})")
    
    # Analyse des positions
    print(f"\n🔍 ANALYSE DES POSITIONS:")
    print("Les colonnes created_at et updated_at ont des positions différentes:")
    
    for col_name in ['created_at', 'updated_at']:
        prod_pos = next((col['ordinal_position'] for col in prod_columns if col['column_name'] == col_name), None)
        test_pos = next((col['ordinal_position'] for col in test_columns if col['column_name'] == col_name), None)
        print(f"  • {col_name}: PROD(pos {prod_pos}) | TEST(pos {test_pos})")
    
    print(f"\n🎯 CONCLUSION:")
    if missing_in_test:
        print("❌ TEST n'est PAS synchronisé avec PROD")
        print("Il manque des colonnes importantes dans l'environnement TEST")
    else:
        print("✅ Toutes les colonnes de PROD sont présentes dans TEST")
        print("Mais l'ordre des colonnes est différent (ce qui est normal)")

if __name__ == "__main__":
    analyze_differences()