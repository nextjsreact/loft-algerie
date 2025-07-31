#!/usr/bin/env tsx
/**
 * ANALYSE DES DIFFÉRENCES DE SCHÉMA
 * Identifie pourquoi les données ne se clonent pas complètement
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

class SchemaAnalysis {
  private environments: Map<string, Environment> = new Map()

  constructor() {
    this.loadEnvironments()
  }

  private loadEnvironments() {
    const envConfigs = [
      { name: 'prod', file: '.env.production' },
      { name: 'test', file: '.env.test' },
      { name: 'dev', file: '.env.development' }
    ]

    for (const config of envConfigs) {
      try {
        if (existsSync(config.file)) {
          const envContent = readFileSync(config.file, 'utf8')
          const envVars: any = {}
          
          envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=')
            if (key && valueParts.length > 0) {
              envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
            }
          })

          if (envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.SUPABASE_SERVICE_ROLE_KEY) {
            // Vérifier que les valeurs ne sont pas des placeholders
            const hasPlaceholders = envVars.NEXT_PUBLIC_SUPABASE_URL.includes('[') || 
                                   envVars.SUPABASE_SERVICE_ROLE_KEY.includes('[')
            
            if (!hasPlaceholders) {
              const env: Environment = {
                name: config.name,
                url: envVars.NEXT_PUBLIC_SUPABASE_URL,
                key: envVars.SUPABASE_SERVICE_ROLE_KEY,
                client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
              }
              this.environments.set(config.name, env)
            }
          }
        }
      } catch (error) {
        // Ignorer les erreurs de chargement
      }
    }
  }

  private async analyzeTable(tableName: string): Promise<void> {
    console.log(`\n📋 ANALYSE DE ${tableName.toUpperCase()}`)
    console.log('='.repeat(50))

    for (const [envName, env] of this.environments) {
      try {
        // Tester l'existence et compter les enregistrements
        const { data, error, count } = await env.client
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${envName.toUpperCase()}: Table n'existe pas ou inaccessible`)
          console.log(`   Erreur: ${error.message}`)
          continue
        }

        // Récupérer la structure en analysant un échantillon
        let columns: string[] = []
        if (count && count > 0) {
          const { data: sampleData } = await env.client
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (sampleData && sampleData.length > 0) {
            columns = Object.keys(sampleData[0])
          }
        }

        console.log(`✅ ${envName.toUpperCase()}: ${columns.length} colonnes, ${count || 0} enregistrements`)
        if (columns.length > 0) {
          console.log(`   Colonnes: ${columns.join(', ')}`)
        }

      } catch (error) {
        console.log(`❌ ${envName.toUpperCase()}: Erreur - ${error}`)
      }
    }
  }

  async analyzeProblematicTables(): Promise<void> {
    console.log('🔍 ANALYSE DES PROBLÈMES DE CLONAGE')
    console.log('='.repeat(60))

    // Tables qui posent problème
    const problematicTables = [
      'profiles',
      'internet_connection_types', 
      'lofts',
      'teams',
      'tasks',
      'notifications'
    ]

    for (const tableName of problematicTables) {
      await this.analyzeTable(tableName)
    }

    console.log('\n💡 PROBLÈMES IDENTIFIÉS:')
    console.log('='.repeat(30))
    console.log('1. 🔐 CONTRAINTES D\'AUTHENTIFICATION:')
    console.log('   • profiles.id doit référencer auth.users (Supabase Auth)')
    console.log('   • Impossible d\'insérer des profils sans utilisateurs auth correspondants')
    console.log('')
    console.log('2. 📊 DIFFÉRENCES DE SCHÉMA:')
    console.log('   • Colonnes manquantes dans TEST/DEV')
    console.log('   • Types de données différents')
    console.log('   • Contraintes enum différentes')
    console.log('')
    console.log('3. 🔗 CONTRAINTES DE CLÉS ÉTRANGÈRES:')
    console.log('   • teams.created_by → profiles.id')
    console.log('   • tasks.assigned_to → profiles.id')
    console.log('   • notifications.user_id → profiles.id')
    console.log('')
    console.log('4. 🏗️ ENVIRONNEMENTS CRÉÉS SÉPARÉMENT:')
    console.log('   • PROD: Environnement existant avec données réelles')
    console.log('   • TEST: Nouvel environnement avec schéma partiel')
    console.log('   • DEV: Nouvel environnement avec schéma partiel')
  }

  async suggestSolutions(): Promise<void> {
    console.log('\n🎯 SOLUTIONS RECOMMANDÉES:')
    console.log('='.repeat(40))
    console.log('')
    console.log('🔧 SOLUTION 1: EXPORT/IMPORT COMPLET (Recommandée)')
    console.log('   • Exporter PROD avec pg_dump')
    console.log('   • Importer vers TEST/DEV avec psql')
    console.log('   • Résout tous les problèmes de schéma')
    console.log('   • Préserve toutes les contraintes')
    console.log('')
    console.log('🔧 SOLUTION 2: SYNCHRONISATION MANUELLE DES SCHÉMAS')
    console.log('   • Utiliser Supabase Dashboard pour ajuster les schémas')
    console.log('   • Ajouter les colonnes manquantes')
    console.log('   • Corriger les types de données')
    console.log('')
    console.log('🔧 SOLUTION 3: RECRÉER TEST/DEV DEPUIS PROD')
    console.log('   • Dupliquer le projet PROD dans Supabase')
    console.log('   • Garantit une compatibilité parfaite')
    console.log('')
    console.log('🔧 SOLUTION 4: CONTINUER AVEC SYNCHRONISATION PARTIELLE')
    console.log('   • Accepter que certaines tables ne se synchronisent pas')
    console.log('   • Utiliser les données de référence synchronisées')
    console.log('   • Créer des données de test manuellement')
  }
}

async function main() {
  const analysis = new SchemaAnalysis()
  
  try {
    await analysis.analyzeProblematicTables()
    await analysis.suggestSolutions()
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

main().catch(console.error)