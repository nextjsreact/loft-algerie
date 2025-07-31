#!/usr/bin/env python3
"""
Analyse rapide avec vos données déjà intégrées
"""

import json
from collections import defaultdict

# Vos données réelles (intégrées directement)
prod_data = [{"table_schema": "auth","table_name": "audit_log_entries","column_name": "instance_id","data_type": "uuid","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "audit_log_entries","column_name": "id","data_type": "uuid","is_nullable": "NO","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "audit_log_entries","column_name": "payload","data_type": "json","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "audit_log_entries","column_name": "created_at","data_type": "timestamp with time zone","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "audit_log_entries","column_name": "ip_address","data_type": "character varying","is_nullable": "NO","column_default": "''::character varying","character_maximum_length": 64},{"table_schema": "auth","table_name": "flow_state","column_name": "id","data_type": "uuid","is_nullable": "NO","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "user_id","data_type": "uuid","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "auth_code","data_type": "text","is_nullable": "NO","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "code_challenge_method","data_type": "USER-DEFINED","is_nullable": "NO","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "code_challenge","data_type": "text","is_nullable": "NO","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "provider_type","data_type": "text","is_nullable": "NO","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "provider_access_token","data_type": "text","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "provider_refresh_token","data_type": "text","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "created_at","data_type": "timestamp with time zone","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "updated_at","data_type": "timestamp with time zone","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "authentication_method","data_type": "text","is_nullable": "NO","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "flow_state","column_name": "auth_code_issued_at","data_type": "timestamp with time zone","is_nullable": "YES","column_default": None,"character_maximum_length": None}]

test_data = [{"table_schema": "auth","table_name": "audit_log_entries","column_name": "instance_id","data_type": "uuid","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "audit_log_entries","column_name": "id","data_type": "uuid","is_nullable": "NO","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "audit_log_entries","column_name": "payload","data_type": "json","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "audit_log_entries","column_name": "created_at","data_type": "timestamp with time zone","is_nullable": "YES","column_default": None,"character_maximum_length": None},{"table_schema": "auth","table_name": "audit_log_entries","column_name": "ip_address","data_type": "character varying","is_nullable": "NO","column_default": "''::character varying","character_maximum_length": 64}]

def count_tables_by_schema(data):
    """Compte les tables par schéma"""
    schema_counts = defaultdict(set)
    for item in data:
        schema_counts[item['table_schema']].add(item['table_name'])
    
    return {schema: len(tables) for schema, tables in schema_counts.items()}

def get_unique_tables(data):
    """Récupère la liste unique des tables"""
    tables = set()
    for item in data:
        tables.add(f"{item['table_schema']}.{item['table_name']}")
    return sorted(tables)

def analyze_lofts_table(data):
    """Analyse spécifique de la table lofts"""
    lofts_columns = []
    for item in data:
        if item['table_name'] == 'lofts' and item['table_schema'] == 'public':
            lofts_columns.append(item['column_name'])
    return sorted(lofts_columns)

# Analyse rapide
print("=" * 60)
print("ANALYSE RAPIDE DES SCHÉMAS")
print("=" * 60)

# Compter les tables
prod_counts = count_tables_by_schema(prod_data)
test_counts = count_tables_by_schema(test_data)

print("\n📊 NOMBRE DE TABLES PAR SCHÉMA:")
print("SCHÉMA".ljust(20) + "PROD".ljust(10) + "TEST".ljust(10) + "DIFFÉRENCE")
print("-" * 50)

all_schemas = set(list(prod_counts.keys()) + list(test_counts.keys()))
for schema in sorted(all_schemas):
    prod_count = prod_counts.get(schema, 0)
    test_count = test_counts.get(schema, 0)
    diff = prod_count - test_count
    diff_str = f"+{diff}" if diff > 0 else str(diff) if diff < 0 else "="
    print(f"{schema.ljust(20)}{str(prod_count).ljust(10)}{str(test_count).ljust(10)}{diff_str}")

# Tables uniques
prod_tables = get_unique_tables(prod_data)
test_tables = get_unique_tables(test_data)

missing_in_test = set(prod_tables) - set(test_tables)
missing_in_prod = set(test_tables) - set(prod_tables)

print(f"\n🚨 TABLES MANQUANTES DANS TEST ({len(missing_in_test)}):")
for table in sorted(missing_in_test):
    print(f"  - {table}")

print(f"\n➕ TABLES EN PLUS DANS TEST ({len(missing_in_prod)}):")
for table in sorted(missing_in_prod):
    print(f"  - {table}")

# Analyse de la table lofts
prod_lofts = analyze_lofts_table(prod_data)
test_lofts = analyze_lofts_table(test_data)

print(f"\n🏠 ANALYSE TABLE LOFTS:")
print(f"  - Colonnes en PROD: {len(prod_lofts)}")
print(f"  - Colonnes en TEST: {len(test_lofts)}")

if prod_lofts and test_lofts:
    missing_lofts_cols = set(prod_lofts) - set(test_lofts)
    if missing_lofts_cols:
        print(f"  - Colonnes manquantes dans TEST:")
        for col in sorted(missing_lofts_cols):
            print(f"    • {col}")

print(f"\n📈 RÉSUMÉ GLOBAL:")
print(f"  - Total tables PROD: {len(prod_tables)}")
print(f"  - Total tables TEST: {len(test_tables)}")
print(f"  - Tables manquantes dans TEST: {len(missing_in_test)}")
print(f"  - Synchronisation: {((len(test_tables)/len(prod_tables))*100):.1f}%")