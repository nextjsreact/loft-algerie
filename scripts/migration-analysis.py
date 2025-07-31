#!/usr/bin/env python3
"""
Analyse des différences de données PROD vs TEST
"""

# Vos données
prod_data = {"profiles": 9, "lofts": 3, "users": 9, "transactions": 0}
test_data = {"profiles": 0, "lofts": 3, "users": 0, "transactions": 0}

def analyze_migration_needs():
    print("=" * 60)
    print("ANALYSE DES DONNÉES MANQUANTES")
    print("=" * 60)
    
    print("\n📊 COMPARAISON PROD vs TEST:")
    print("TABLE".ljust(15) + "PROD".ljust(8) + "TEST".ljust(8) + "STATUT")
    print("-" * 50)
    
    issues = []
    ok_tables = []
    
    for table in prod_data:
        prod_count = prod_data[table]
        test_count = test_data[table]
        
        if prod_count == test_count:
            status = "✅ IDENTIQUE"
            ok_tables.append(table)
        elif test_count == 0 and prod_count > 0:
            status = f"🚨 MANQUE {prod_count}"
            issues.append((table, prod_count, "VIDE"))
        elif test_count < prod_count:
            status = f"⚠️  MANQUE {prod_count - test_count}"
            issues.append((table, prod_count - test_count, "PARTIEL"))
        else:
            status = f"➕ +{test_count - prod_count}"
        
        print(f"{table.ljust(15)}{str(prod_count).ljust(8)}{str(test_count).ljust(8)}{status}")
    
    print("\n🎯 DIAGNOSTIC:")
    
    if issues:
        print("❌ PROBLÈMES IDENTIFIÉS:")
        for table, missing, issue_type in issues:
            if issue_type == "VIDE":
                print(f"  • {table}: Table complètement vide ({missing} enregistrements manquants)")
            else:
                print(f"  • {table}: {missing} enregistrements manquants")
    
    if ok_tables:
        print("✅ TABLES SYNCHRONISÉES:")
        for table in ok_tables:
            print(f"  • {table}: Parfaitement synchronisé")
    
    print("\n🔍 ANALYSE DÉTAILLÉE:")
    
    # Profiles - critique
    if test_data["profiles"] == 0:
        print("🚨 CRITIQUE: Table 'profiles' vide dans TEST")
        print("  → Impact: Impossible de se connecter à l'application")
        print("  → Solution: Créer des utilisateurs de test ou migrer depuis PROD")
    
    # Users - critique  
    if test_data["users"] == 0:
        print("🚨 CRITIQUE: Table 'auth.users' vide dans TEST")
        print("  → Impact: Aucun utilisateur système")
        print("  → Solution: Synchroniser avec la table profiles")
    
    # Lofts - OK
    if prod_data["lofts"] == test_data["lofts"]:
        print("✅ BIEN: Table 'lofts' synchronisée")
        print("  → 3 lofts présents dans les deux environnements")
    
    # Transactions - normal pour TEST
    if prod_data["transactions"] == 0 and test_data["transactions"] == 0:
        print("ℹ️  INFO: Aucune transaction dans les deux environnements")
        print("  → Normal pour un environnement de développement")
    
    print("\n🚀 PLAN D'ACTION RECOMMANDÉ:")
    print("1. URGENT: Créer des utilisateurs de test")
    print("2. Synchroniser les profils utilisateurs")
    print("3. Vérifier la cohérence profiles ↔ auth.users")
    print("4. Tester la connexion à l'application")
    
    print("\n📋 PRIORITÉS:")
    print("🔴 HAUTE: profiles, auth.users (bloquant pour l'app)")
    print("🟢 BASSE: transactions (pas critique pour les tests)")

if __name__ == "__main__":
    analyze_migration_needs()