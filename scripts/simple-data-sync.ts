#!/usr/bin/env tsx
/**
 * SYNCHRONISATION SIMPLE DES DONNÉES
 * Copie les données en gérant les différences de schéma
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

class SimpleDataSync {
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

  private async syncTable(tableName: string, selectColumns?: string[]): Promise<boolean> {
    try {
      console.log(`\n📋 Synchronisation de ${tableName}...`)

      // Récupérer les données source
      const selectQuery = selectColumns ? selectColumns.join(', ') : '*'
      const { data: sourceData, error: sourceError } = await this.sourceEnv.client
        .from(tableName)
        .select(selectQuery)

      if (sourceError) {
        console.log(`   ❌ Erreur source: ${sourceError.message}`)
        return false
      }

      if (!sourceData || sourceData.length === 0) {
        console.log(`   ℹ️ Table source vide`)
        return true
      }

      console.log(`   📊 ${sourceData.length} enregistrements à synchroniser`)

      // Vider la table cible
      const { error: deleteError } = await this.targetEnv.client
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError && !deleteError.message.includes('No rows found')) {
        console.log(`   ⚠️ Nettoyage: ${deleteError.message}`)
      }

      // Insérer les données
      const { data: insertedData, error: insertError } = await this.targetEnv.client
        .from(tableName)
        .insert(sourceData)

      if (insertError) {
        console.log(`   ❌ Erreur insertion: ${insertError.message}`)
        return false
      }

      console.log(`   ✅ ${sourceData.length} enregistrements synchronisés`)
      return true

    } catch (error) {
      console.log(`   ❌ Erreur: ${error}`)
      return false
    }
  }

  async executeSync(): Promise<void> {
    console.log('🔄 SYNCHRONISATION SIMPLE DES DONNÉES')
    console.log('='.repeat(50))

    await this.initializeEnvironments()

    let successCount = 0
    let totalCount = 0

    // Tables de référence (sans dépendances)
    const referenceTables = [
      { name: 'zone_areas', columns: ['id', 'name', 'created_at'] },
      { name: 'internet_connection_types', columns: ['id', 'type', 'speed', 'provider', 'status', 'cost', 'created_at'] },
      { name: 'categories', columns: ['id', 'name', 'description', 'type', 'created_at'] },
      { name: 'currencies', columns: ['id', 'code', 'name', 'symbol', 'is_default', 'created_at', 'updated_at', 'ratio'] },
      { name: 'payment_methods', columns: ['id', 'name', 'type', 'details', 'created_at'] }
    ]

    // Synchroniser les tables de référence
    for (const table of referenceTables) {
      totalCount++
      const success = await this.syncTable(table.name, table.columns)
      if (success) successCount++
    }

    // Tables avec dépendances (après les références)
    const dependentTables = [
      { name: 'profiles', columns: ['id', 'email', 'full_name', 'role', 'email_verified', 'created_at', 'updated_at'] },
      { name: 'loft_owners' }, // Déjà synchronisé
      { name: 'transaction_category_references' } // Déjà synchronisé
    ]

    // Synchroniser les profils (nécessaire pour les autres tables)
    totalCount++
    const profilesSuccess = await this.syncTable('profiles', dependentTables[0].columns)
    if (profilesSuccess) successCount++

    // Tables avec relations complexes (en dernier)
    const complexTables = [
      { name: 'lofts', columns: ['id', 'name', 'description', 'address', 'price_per_month', 'status', 'owner_id', 'company_percentage', 'owner_percentage', 'created_at', 'updated_at', 'zone_area_id', 'price_per_night'] },
      { name: 'teams', columns: ['id', 'name', 'description', 'created_by', 'created_at', 'updated_at'] },
      { name: 'tasks', columns: ['id', 'title', 'description', 'status', 'due_date', 'assigned_to', 'team_id', 'loft_id', 'created_by', 'created_at', 'updated_at'] },
      { name: 'notifications', columns: ['id', 'user_id', 'title', 'message', 'is_read', 'created_at', 'link', 'sender_id', 'type'] },
      { name: 'conversations', columns: ['id', 'name', 'type', 'created_at', 'updated_at'] },
      { name: 'conversation_participants', columns: ['id', 'conversation_id', 'user_id', 'joined_at', 'last_read_at', 'role'] },
      { name: 'messages', columns: ['id', 'conversation_id', 'sender_id', 'content', 'message_type', 'created_at', 'updated_at', 'edited'] }
    ]

    for (const table of complexTables) {
      totalCount++
      const success = await this.syncTable(table.name, table.columns)
      if (success) successCount++
    }

    console.log('\n📊 RÉSUMÉ DE LA SYNCHRONISATION')
    console.log('='.repeat(40))
    console.log(`✅ Tables réussies: ${successCount}/${totalCount}`)
    
    if (successCount === totalCount) {
      console.log('\n🎉 SYNCHRONISATION TERMINÉE AVEC SUCCÈS!')
      console.log('🔄 Vous pouvez maintenant relancer le diagnostic pour vérifier')
    } else {
      console.log('\n⚠️ SYNCHRONISATION TERMINÉE AVEC DES AVERTISSEMENTS')
      console.log('📋 Certaines tables n\'ont pas pu être synchronisées')
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('Usage: npx tsx scripts/simple-data-sync.ts <source> <target>')
    console.log('Exemple: npx tsx scripts/simple-data-sync.ts prod test')
    process.exit(1)
  }

  const [source, target] = args
  const sync = new SimpleDataSync(source, target)
  
  try {
    await sync.executeSync()
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main().catch(console.error)