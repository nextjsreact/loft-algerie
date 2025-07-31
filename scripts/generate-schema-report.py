#!/usr/bin/env python3
"""
Script pour comparer automatiquement les schémas PROD vs TEST
Usage: python generate-schema-report.py
"""

import psycopg2
import json
from datetime import datetime

# Configuration des connexions (à adapter selon votre environnement)
PROD_CONFIG = {
    'host': 'prod-db-host',
    'database': 'your_prod_db',
    'user': 'your_user',
    'password': 'your_password'
}

TEST_CONFIG = {
    'host': 'test-db-host', 
    'database': 'your_test_db',
    'user': 'your_user',
    'password': 'your_password'
}

def get_schema_info(config, env_name):
    """Récupère les informations de schéma d'une base de données"""
    try:
        conn = psycopg2.connect(**config)
        cur = conn.cursor()
        
        # Requête pour récupérer toutes les tables et colonnes
        query = """
        SELECT 
            t.table_schema,
            t.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name 
            AND t.table_schema = c.table_schema
        WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY t.table_schema, t.table_name, c.ordinal_position;
        """
        
        cur.execute(query)
        results = cur.fetchall()
        
        schema_info = {}
        for row in results:
            schema, table, column, data_type, nullable, default = row
            if schema not in schema_info:
                schema_info[schema] = {}
            if table not in schema_info[schema]:
                schema_info[schema][table] = {}
            
            schema_info[schema][table][column] = {
                'type': data_type,
                'nullable': nullable,
                'default': default
            }
        
        conn.close()
        return schema_info
        
    except Exception as e:
        print(f"Erreur connexion {env_name}: {e}")
        return None

def compare_schemas(prod_schema, test_schema):
    """Compare les schémas et génère un rapport"""
    differences = {
        'missing_tables_in_test': [],
        'missing_tables_in_prod': [],
        'missing_columns_in_test': [],
        'missing_columns_in_prod': [],
        'column_differences': []
    }
    
    # Tables manquantes
    for schema in prod_schema:
        if schema not in test_schema:
            continue
        for table in prod_schema[schema]:
            if table not in test_schema[schema]:
                differences['missing_tables_in_test'].append(f"{schema}.{table}")
    
    for schema in test_schema:
        if schema not in prod_schema:
            continue
        for table in test_schema[schema]:
            if table not in prod_schema[schema]:
                differences['missing_tables_in_prod'].append(f"{schema}.{table}")
    
    # Colonnes manquantes
    for schema in prod_schema:
        if schema not in test_schema:
            continue
        for table in prod_schema[schema]:
            if table not in test_schema[schema]:
                continue
            for column in prod_schema[schema][table]:
                if column not in test_schema[schema][table]:
                    differences['missing_columns_in_test'].append(f"{schema}.{table}.{column}")
    
    return differences

def generate_report(differences):
    """Génère un rapport HTML des différences"""
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rapport de Comparaison Schémas</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .section {{ margin: 20px 0; }}
            .missing {{ color: red; }}
            .extra {{ color: orange; }}
            ul {{ list-style-type: none; }}
            li {{ padding: 5px; background: #f5f5f5; margin: 2px 0; }}
        </style>
    </head>
    <body>
        <h1>Rapport de Comparaison Schémas PROD vs TEST</h1>
        <p>Généré le: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="section">
            <h2 class="missing">Tables manquantes dans TEST ({len(differences['missing_tables_in_test'])})</h2>
            <ul>
                {''.join([f'<li>{table}</li>' for table in differences['missing_tables_in_test']])}
            </ul>
        </div>
        
        <div class="section">
            <h2 class="extra">Tables en plus dans TEST ({len(differences['missing_tables_in_prod'])})</h2>
            <ul>
                {''.join([f'<li>{table}</li>' for table in differences['missing_tables_in_prod']])}
            </ul>
        </div>
        
        <div class="section">
            <h2 class="missing">Colonnes manquantes dans TEST ({len(differences['missing_columns_in_test'])})</h2>
            <ul>
                {''.join([f'<li>{col}</li>' for col in differences['missing_columns_in_test']])}
            </ul>
        </div>
    </body>
    </html>
    """
    
    with open('schema-comparison-report.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("Rapport généré: schema-comparison-report.html")

if __name__ == "__main__":
    print("Récupération du schéma PROD...")
    # prod_schema = get_schema_info(PROD_CONFIG, "PROD")
    
    print("Récupération du schéma TEST...")
    # test_schema = get_schema_info(TEST_CONFIG, "TEST")
    
    # Pour le moment, utilisez les fichiers JSON exportés manuellement
    print("ATTENTION: Configurez d'abord les paramètres de connexion dans ce script")
    print("Puis décommentez les lignes de connexion")