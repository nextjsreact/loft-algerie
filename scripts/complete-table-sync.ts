#!/usr/bin/env tsx
/**
 * SYNCHRONISATION COMPLÈTE TABLE PAR TABLE
 * Alternative robuste à l'export/import direct
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

interface SyncResult {
  table: string
  success: boolean
  sourceCount: number
  targetCount: number
  error?: string
}

class CompleteTableSync {
  private sourceEnv!: Environment
  private targetEnv!: Environment

  constructor(private sourceName: string, private targetName: string) {}

  private loadEnvironment(envName: string): Environment {
    const envFile = envName === 'dev' ? '.env.development' : `.env.${envName}`
    
    if (!existsSync(envFile)) {
      throw new Error(`❌ Fichier ${envFile} non trouvé`)
    }

    const envContent = readFileSync(envFile, 'utf8')
    const envVars: any = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
      }
    })

    if (!envVars.NEXT_PUBLIC_SUPABASE_URL || !envVars.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(`❌ Variables d'environnement manquantes dans ${envFile}`)
    }

    return {
      name: envName,
      url: envVars.NEXT_PUBLIC_SUPABASE_URL,
      key: envVars.SUPABASE_SERVICE_ROLE_KEY,
      client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
    }
  }

  private async initializeEnvironments(): Promise<void> {
    console.log(`🔗 Initialisation des environnements ${this.sourceName.toUpperCase()} → ${this.targetName.toUpperCase()}`)
    
    this.sourceEnv = this.loadEnvironment(this.sourceName)
    this.targetEnv = this.loadEnvironment(this.targetName)
    
    console.log(`✅ Connexions établies`)
  }

  private async syncTableWithColumns(tableName: string, columns: string[]): Promise<SyncResult> {
    const result: SyncResult = {
      table: tableName,
      success: false,
      sourceCount: 0,
      targetCount: 0
    }

    try {
      console.log(`\n📋 Synchronisation de ${tableName}...`)

      // Récupérer les données source avec colonnes spécifiques
      const selectQuery = columns.join(', ')
      const { data: sourceData, error: sourceError } = await this.sourceEnv.client
        .from(tableName)
        .select(selectQuery)

      if (sourceError) {
        result.error = `Erreur source: ${sourceError.message}`
        console.log(`   ❌ ${result.error}`)
        return result
      }

      if (!sourceData || sourceData.length === 0) {
        console.log(`   ℹ️ Table source vide`)
        result.success = true
        return result
      }

      result.sourceCount = sourceData.length
      console.log(`   📊 ${sourceData.length} enregistrements à synchroniser`)

      // Vider la table cible (sauf pour certaines tables système)
      if (!['settings', 'transaction_category_references', 'loft_owners'].includes(tableName)) {
        const { error: deleteError } = await this.targetEnv.client
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError && !deleteError.message.includes('No rows found')) {
          console.log(`   ⚠️ Nettoyage: ${deleteError.message}`)
        }
      }

      // Insérer par petits lots
      const batchSize = 10
      let insertedCount = 0

      for (let i = 0; i < sourceData.length; i += batchSize) {
        const batch = sourceData.slice(i, i + batchSize)
        
        const { error: insertError } = await this.targetEnv.client
          .from(tableName)
          .insert(batch)

        if (insertError) {
          console.log(`   ⚠️ Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
          
          // Essayer insertion individuelle
          for (const record of batch) {
            const { error: singleError } = await this.targetEnv.client
              .from(tableName)
              .insert([record])
            
            if (!singleError) {
              insertedCount++
            }
          }
        } else {
          insertedCount += batch.length
        }
      }

      result.targetCount = insertedCount
      result.success = insertedCount > 0 || sourceData.length === 0
      
      console.log(`   ✅ ${insertedCount}/${sourceData.length} enregistrements synchronisés`)

    } catch (error) {
      result.error = `Erreur: ${error}`
      console.log(`   ❌ ${result.error}`)
    }

    return result
  }

  async executeCompleteSync(): Promise<void> {
    console.log('🔄 SYNCHRONISATION COMPLÈTE TABLE PAR TABLE')
    console.log('='.repeat(60))

    await this.initializeEnvironments()

    const results: SyncResult[] = []

    // Phase 1: Tables de référence (sans dépendances)
    console.log('\n📋 PHASE 1: TABLES DE RÉFÉRENCE')
    console.log('='.repeat(40))

    const referenceTables = [
      { name: 'zone_areas', columns: ['id', 'name', 'created_at'] },
      { name: 'internet_connection_types', columns: ['id', 'type', 'speed', 'provider', 'status', 'cost', 'created_at'] },
      { name: 'categories', columns: ['id', 'name', 'description', 'type', 'created_at'] },
      { name: 'currencies', columns: ['id', 'code', 'name', 'symbol', 'is_default', 'created_at', 'ratio'] },
      { name: 'payment_methods', columns: ['id', 'name', 'type', 'details', 'created_at'] }
    ]

    for (const table of referenceTables) {
      const result = await this.syncTableWithColumns(table.name, table.columns)
      results.push(result)
    }

    // Phase 2: Tables utilisateurs
    console.log('\n📋 PHASE 2: TABLES UTILISATEURS')
    console.log('='.repeat(40))

    const userTables = [
      { name: 'profiles', columns: ['id', 'email', 'full_name', 'role', 'created_at', 'updated_at'] }
    ]

    for (const table of userTables) {
      const result = await this.syncTableWithColumns(table.name, table.columns)
      results.push(result)
    }

    // Phase 3: Tables avec dépendances
    console.log('\n📋 PHASE 3: TABLES AVEC DÉPENDANCES')
    console.log('='.repeat(40))

    const dependentTables = [
      { name: 'lofts', columns: ['id', 'name', 'description', 'address', 'price_per_month', 'status', 'owner_id', 'company_percentage', 'owner_percentage', 'created_at', 'updated_at', 'zone_area_id', 'price_per_night'] },
      { name: 'teams', columns: ['id', 'name', 'description', 'created_by', 'created_at', 'updated_at'] },
      { name: 'tasks', columns: ['id', 'title', 'description', 'status', 'due_date', 'assigned_to', 'team_id', 'loft_id', 'created_by', 'created_at', 'updated_at'] },
      { name: 'notifications', columns: ['id', 'user_id', 'title', 'message', 'is_read', 'created_at', 'link', 'sender_id', 'type'] },
      { name: 'conversations', columns: ['id', 'type', 'created_at', 'updated_at'] },
      { name: 'conversation_participants', columns: ['id', 'conversation_id', 'user_id', 'joined_at', 'last_read_at'] },
      { name: 'messages', columns: ['id', 'conversation_id', 'sender_id', 'content', 'message_type', 'created_at', 'updated_at'] }
    ]

    for (const table of dependentTables) {
      const result = await this.syncTableWithColumns(table.name, table.columns)
      results.push(result)
    }

    // Résumé final
    console.log('\n📊 RÉSUMÉ DE LA SYNCHRONISATION COMPLÈTE')
    console.log('='.repeat(50))

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const totalRecords = results.reduce((sum, r) => sum + r.targetCount, 0)

    console.log(`✅ Tables réussies: ${successful.length}/${results.length}`)
    console.log(`📊 Total enregistrements synchronisés: ${totalRecords}`)
    
    if (failed.length > 0) {
      console.log(`\n❌ Tables avec erreurs:`)
      failed.forEach(r => {
        console.log(`   • ${r.table}: ${r.error}`)
      })
    }

    if (successful.length === results.length) {
      console.log('\n🎉 SYNCHRONISATION COMPLÈTE RÉUSSIE!')
      console.log('🔍 Lancez le diagnostic pour vérifier:')
      console.log('npx tsx scripts/complete-sync-diagnosis.ts')
    } else {
      console.log('\n⚠️ SYNCHRONISATION PARTIELLE')
      console.log('📋 Certaines tables nécessitent une attention manuelle')
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('Usage: npx tsx scripts/complete-table-sync.ts <source> <target>')
    console.log('Exemple: npx tsx scripts/complete-table-sync.ts prod test')
    process.exit(1)
  }

  const [source, target] = args
  const sync = new CompleteTableSync(source, target)
  
  try {
    await sync.executeCompleteSync()
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main().catch(console.error)