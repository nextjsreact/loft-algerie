#!/usr/bin/env python3
"""
Analyse automatique des différences entre schémas PROD vs TEST
"""

import json
from collections import defaultdict

# Vos données (remplacez par vos exports réels)
prod_data = []  # Coller ici le premier export
test_data = []  # Coller ici le second export

def parse_schema_data(data):
    """Parse les données de schéma en structure organisée"""
    schema_info = defaultdict(lambda: defaultdict(dict))
    
    for item in data:
        schema = item['table_schema']
        table = item['table_name']
        column = item['column_name']
        
        schema_info[schema][table][column] = {
            'data_type': item['data_type'],
            'is_nullable': item['is_nullable'],
            'column_default': item['column_default'],
            'character_maximum_length': item['character_maximum_length']
        }
    
    return schema_info

def compare_schemas(prod_schema, test_schema):
    """Compare les schémas et retourne les différences"""
    differences = {
        'missing_tables_in_test': [],
        'missing_tables_in_prod': [],
        'missing_columns_in_test': [],
        'missing_columns_in_prod': [],
        'column_type_differences': [],
        'summary': {}
    }
    
    # Comparer les tables
    for schema_name in prod_schema:
        if schema_name not in test_schema:
            for table_name in prod_schema[schema_name]:
                differences['missing_tables_in_test'].append(f"{schema_name}.{table_name}")
            continue
            
        for table_name in prod_schema[schema_name]:
            if table_name not in test_schema[schema_name]:
                differences['missing_tables_in_test'].append(f"{schema_name}.{table_name}")
                continue
                
            # Comparer les colonnes
            prod_table = prod_schema[schema_name][table_name]
            test_table = test_schema[schema_name][table_name]
            
            for column_name in prod_table:
                if column_name not in test_table:
                    differences['missing_columns_in_test'].append(f"{schema_name}.{table_name}.{column_name}")
                else:
                    # Vérifier les types de données
                    prod_col = prod_table[column_name]
                    test_col = test_table[column_name]
                    
                    if prod_col['data_type'] != test_col['data_type']:
                        differences['column_type_differences'].append({
                            'table': f"{schema_name}.{table_name}.{column_name}",
                            'prod_type': prod_col['data_type'],
                            'test_type': test_col['data_type']
                        })
    
    # Tables en plus dans TEST
    for schema_name in test_schema:
        if schema_name not in prod_schema:
            for table_name in test_schema[schema_name]:
                differences['missing_tables_in_prod'].append(f"{schema_name}.{table_name}")
            continue
            
        for table_name in test_schema[schema_name]:
            if table_name not in prod_schema[schema_name]:
                differences['missing_tables_in_prod'].append(f"{schema_name}.{table_name}")
                continue
                
            # Colonnes en plus dans TEST
            test_table = test_schema[schema_name][table_name]
            prod_table = prod_schema[schema_name][table_name]
            
            for column_name in test_table:
                if column_name not in prod_table:
                    differences['missing_columns_in_prod'].append(f"{schema_name}.{table_name}.{column_name}")
    
    # Résumé
    differences['summary'] = {
        'total_missing_tables_in_test': len(differences['missing_tables_in_test']),
        'total_missing_tables_in_prod': len(differences['missing_tables_in_prod']),
        'total_missing_columns_in_test': len(differences['missing_columns_in_test']),
        'total_missing_columns_in_prod': len(differences['missing_columns_in_prod']),
        'total_type_differences': len(differences['column_type_differences'])
    }
    
    return differences

def generate_report(differences):
    """Génère un rapport lisible"""
    report = []
    report.append("=" * 60)
    report.append("RAPPORT DE COMPARAISON SCHÉMAS PROD vs TEST")
    report.append("=" * 60)
    report.append("")
    
    # Résumé
    summary = differences['summary']
    report.append("📊 RÉSUMÉ:")
    report.append(f"• Tables manquantes dans TEST: {summary['total_missing_tables_in_test']}")
    report.append(f"• Tables en plus dans TEST: {summary['total_missing_tables_in_prod']}")
    report.append(f"• Colonnes manquantes dans TEST: {summary['total_missing_columns_in_test']}")
    report.append(f"• Colonnes en plus dans TEST: {summary['total_missing_columns_in_prod']}")
    report.append(f"• Différences de types: {summary['total_type_differences']}")
    report.append("")
    
    # Tables manquantes dans TEST
    if differences['missing_tables_in_test']:
        report.append("🚨 TABLES MANQUANTES DANS TEST:")
        for table in differences['missing_tables_in_test']:
            report.append(f"  - {table}")
        report.append("")
    
    # Colonnes manquantes dans TEST
    if differences['missing_columns_in_test']:
        report.append("⚠️  COLONNES MANQUANTES DANS TEST:")
        for column in differences['missing_columns_in_test']:
            report.append(f"  - {column}")
        report.append("")
    
    # Différences de types
    if differences['column_type_differences']:
        report.append("🔄 DIFFÉRENCES DE TYPES:")
        for diff in differences['column_type_differences']:
            report.append(f"  - {diff['table']}: PROD({diff['prod_type']}) vs TEST({diff['test_type']})")
        report.append("")
    
    return "\n".join(report)

if __name__ == "__main__":
    print("⚠️  ATTENTION: Vous devez d'abord coller vos données JSON dans ce script")
    print("Modifiez les variables 'prod_data' et 'test_data' avec vos exports")
    print("")
    print("Exemple d'utilisation:")
    print("1. Remplacez prod_data = [] par prod_data = [votre_premier_export]")
    print("2. Remplacez test_data = [] par test_data = [votre_second_export]")
    print("3. Relancez le script")
    
    # Si vous avez des données, décommentez ces lignes:
    # prod_schema = parse_schema_data(prod_data)
    # test_schema = parse_schema_data(test_data)
    # differences = compare_schemas(prod_schema, test_schema)
    # report = generate_report(differences)
    # print(report)
    
    # Sauvegarder le rapport
    # with open('schema-comparison-report.txt', 'w', encoding='utf-8') as f:
    #     f.write(report)
    # print("Rapport sauvegardé dans: schema-comparison-report.txt")