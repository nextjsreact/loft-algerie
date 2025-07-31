#!/usr/bin/env tsx
/**
 * SYNCHRONISATION DES DONNÉES DE RÉFÉRENCE
 * Synchronise les tables de référence qui fonctionnent bien
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

class ReferenceDataSync {
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

  private async syncTable(tableName: string): Promise<boolean> {
    try {
      console.log(`\n📋 Synchronisation de ${tableName}...`)

      // Récupérer les données source
      const { data: sourceData, error: sourceError } = await this.sourceEnv.client
        .from(tableName)
        .select('*')

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
      const { error: insertError } = await this.targetEnv.client
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

  async syncReferenceData(): Promise<void> {
    console.log('📚 SYNCHRONISATION DES DONNÉES DE RÉFÉRENCE')
    console.log('='.repeat(60))

    await this.initializeEnvironments()

    // Tables de référence qui fonctionnent bien
    const referenceTables = [
      'loft_owners',
      'transaction_category_references', 
      'settings'
    ]

    let successCount = 0
    let totalCount = referenceTables.length

    for (const tableName of referenceTables) {
      const success = await this.syncTable(tableName)
      if (success) successCount++
    }

    console.log('\n📊 RÉSUMÉ DE LA SYNCHRONISATION')
    console.log('='.repeat(40))
    console.log(`✅ Tables réussies: ${successCount}/${totalCount}`)
    
    if (successCount === totalCount) {
      console.log('\n🎉 DONNÉES DE RÉFÉRENCE SYNCHRONISÉES!')
    } else {
      console.log('\n⚠️ SYNCHRONISATION PARTIELLE')
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('Usage: npx tsx scripts/sync-reference-data.ts <source> <target>')
    console.log('Exemple: npx tsx scripts/sync-reference-data.ts prod dev')
    process.exit(1)
  }

  const [source, target] = args
  const sync = new ReferenceDataSync(source, target)
  
  try {
    await sync.syncReferenceData()
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main().catch(console.error)