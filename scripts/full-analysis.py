#!/usr/bin/env python3
"""
Analyse complète des différences entre vos schémas
"""

from collections import defaultdict

def analyze_schemas():
    # Compter les tables par schéma dans chaque environnement
    prod_schemas = defaultdict(set)
    test_schemas = defaultdict(set)
    
    # Données PROD (premier export)
    prod_tables = [
        "auth.audit_log_entries", "auth.flow_state", "auth.identities", "auth.instances",
        "auth.mfa_amr_claims", "auth.mfa_challenges", "auth.mfa_factors", "auth.one_time_tokens",
        "auth.refresh_tokens", "auth.saml_providers", "auth.saml_relay_states", "auth.schema_migrations",
        "auth.sessions", "auth.sso_domains", "auth.sso_providers", "auth.users",
        "extensions.pg_stat_statements", "extensions.pg_stat_statements_info",
        "public.categories", "public.conversation_participants", "public.conversations",
        "public.currencies", "public.internet_connection_types", "public.loft_owners",
        "public.lofts", "public.messages", "public.notifications", "public.payment_methods",
        "public.profiles", "public.settings", "public.tasks", "public.team_members",
        "public.teams", "public.transaction_category_references", "public.transactions",
        "public.user_sessions", "public.zone_areas",
        "realtime.messages", "realtime.schema_migrations", "realtime.subscription",
        "storage.buckets", "storage.migrations", "storage.objects", "storage.s3_multipart_uploads",
        "storage.s3_multipart_uploads_parts",
        "vault.decrypted_secrets", "vault.secrets"
    ]
    
    # Données TEST (second export) - identiques selon vos données
    test_tables = [
        "auth.audit_log_entries", "auth.flow_state", "auth.identities", "auth.instances",
        "auth.mfa_amr_claims", "auth.mfa_challenges", "auth.mfa_factors", "auth.one_time_tokens",
        "auth.refresh_tokens", "auth.saml_providers", "auth.saml_relay_states", "auth.schema_migrations",
        "auth.sessions", "auth.sso_domains", "auth.sso_providers", "auth.users",
        "extensions.pg_stat_statements", "extensions.pg_stat_statements_info",
        "public.categories", "public.conversation_participants", "public.conversations",
        "public.currencies", "public.internet_connection_types", "public.loft_owners",
        "public.lofts", "public.messages", "public.notifications", "public.payment_methods",
        "public.profiles", "public.settings", "public.tasks", "public.team_members",
        "public.teams", "public.transaction_category_references", "public.transactions",
        "public.user_sessions", "public.zone_areas",
        "realtime.messages", "realtime.schema_migrations", "realtime.subscription",
        "storage.buckets", "storage.migrations", "storage.objects", "storage.s3_multipart_uploads",
        "storage.s3_multipart_uploads_parts",
        "vault.decrypted_secrets", "vault.secrets"
    ]
    
    # Organiser par schéma
    for table in prod_tables:
        schema, table_name = table.split('.', 1)
        prod_schemas[schema].add(table_name)
    
    for table in test_tables:
        schema, table_name = table.split('.', 1)
        test_schemas[schema].add(table_name)
    
    print("=" * 70)
    print("ANALYSE COMPLÈTE DES SCHÉMAS PROD vs TEST")
    print("=" * 70)
    
    print("\n📊 RÉSUMÉ PAR SCHÉMA:")
    print("SCHÉMA".ljust(15) + "PROD".ljust(8) + "TEST".ljust(8) + "STATUT")
    print("-" * 50)
    
    all_schemas = sorted(set(list(prod_schemas.keys()) + list(test_schemas.keys())))
    total_prod = 0
    total_test = 0
    
    for schema in all_schemas:
        prod_count = len(prod_schemas.get(schema, set()))
        test_count = len(test_schemas.get(schema, set()))
        total_prod += prod_count
        total_test += test_count
        
        if prod_count == test_count:
            status = "✅ IDENTIQUE"
        elif prod_count > test_count:
            status = f"⚠️  -{prod_count-test_count} dans TEST"
        else:
            status = f"➕ +{test_count-prod_count} dans TEST"
        
        print(f"{schema.ljust(15)}{str(prod_count).ljust(8)}{str(test_count).ljust(8)}{status}")
    
    print("-" * 50)
    print(f"{'TOTAL'.ljust(15)}{str(total_prod).ljust(8)}{str(total_test).ljust(8)}")
    
    # Vérifier les différences de tables
    missing_in_test = set(prod_tables) - set(test_tables)
    extra_in_test = set(test_tables) - set(prod_tables)
    
    if missing_in_test:
        print(f"\n🚨 TABLES MANQUANTES DANS TEST ({len(missing_in_test)}):")
        for table in sorted(missing_in_test):
            print(f"  - {table}")
    
    if extra_in_test:
        print(f"\n➕ TABLES EN PLUS DANS TEST ({len(extra_in_test)}):")
        for table in sorted(extra_in_test):
            print(f"  - {table}")
    
    if not missing_in_test and not extra_in_test:
        print("\n✅ EXCELLENTE NOUVELLE!")
        print("Toutes les tables sont présentes dans les deux environnements!")
        print("Les schémas sont parfaitement synchronisés au niveau des tables.")
    
    # Analyse spécifique pour la table lofts et les colonnes TV
    print(f"\n🏠 VÉRIFICATION SPÉCIALE - TABLE LOFTS:")
    print("Vos colonnes TV sont-elles présentes dans les deux environnements?")
    print("• frequence_paiement_tv")
    print("• prochaine_echeance_tv")
    print("\nPour vérifier, exécutez cette requête sur les deux environnements:")
    print("SELECT column_name FROM information_schema.columns")
    print("WHERE table_name = 'lofts' AND column_name LIKE '%tv%';")
    
    print(f"\n📈 CONCLUSION:")
    sync_percentage = (min(total_prod, total_test) / max(total_prod, total_test)) * 100
    print(f"• Synchronisation des tables: {sync_percentage:.1f}%")
    
    if sync_percentage == 100:
        print("• ✅ Vos environnements sont synchronisés au niveau des tables!")
        print("• Le problème pourrait être au niveau des colonnes ou des données")
        print("• Vérifiez si votre script TV a été exécuté sur TEST")
    else:
        print("• ⚠️  Il y a des différences de tables entre PROD et TEST")
        print("• Vous devez synchroniser les schémas avant de continuer")

if __name__ == "__main__":
    analyze_schemas()