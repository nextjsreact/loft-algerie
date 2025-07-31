#!/usr/bin/env tsx
/**
 * CRÉATION DES TABLES MANQUANTES
 * Crée les tables manquantes en utilisant des insertions de données de structure
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

class TableCreator {
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

  private async getSampleRecord(tableName: string): Promise<any> {
    try {
      const { data, error } = await this.sourceEnv.client
        .from(tableName)
        .select('*')
        .limit(1)

      if (error || !data || data.length === 0) {
        return null
      }

      return data[0]
    } catch (error) {
      return null
    }
  }

  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const { error } = await this.targetEnv.client
        .from(tableName)
        .select('*')
        .limit(0)

      return !error
    } catch (error) {
      return false
    }
  }

  private async createTableFromSample(tableName: string, sampleRecord: any): Promise<boolean> {
    try {
      console.log(`   🔨 Création de la structure pour ${tableName}`)
      
      // Insérer l'enregistrement exemple pour créer la structure
      const { error: insertError } = await this.targetEnv.client
        .from(tableName)
        .insert(sampleRecord)

      if (insertError) {
        console.log(`   ❌ Erreur lors de l'insertion: ${insertError.message}`)
        return false
      }

      // Supprimer l'enregistrement exemple
      const { error: deleteError } = await this.targetEnv.client
        .from(tableName)
        .delete()
        .eq('id', sampleRecord.id)

      if (deleteError) {
        console.log(`   ⚠️ Avertissement: impossible de supprimer l'enregistrement exemple: ${deleteError.message}`)
      }

      console.log(`   ✅ Table ${tableName} créée avec succès`)
      return true
    } catch (error) {
      console.log(`   ❌ Erreur lors de la création: ${error}`)
      return false
    }
  }

  async createMissingTables(): Promise<void> {
    await this.initializeEnvironments()

    const tablesToCheck = [
      'profiles', 'user_sessions', 'zone_areas', 'internet_connection_types',
      'lofts', 'categories', 'currencies', 'payment_methods',
      'teams', 'team_members', 'tasks', 'transactions', 'notifications',
      'conversations', 'conversation_participants', 'messages'
    ]

    console.log('\n📋 CRÉATION DES TABLES MANQUANTES')
    console.log('='.repeat(50))

    let created = 0
    let skipped = 0
    let errors = 0

    for (const tableName of tablesToCheck) {
      console.log(`\n📋 Vérification de ${tableName}...`)

      // Vérifier si la table existe déjà
      const exists = await this.tableExists(tableName)
      if (exists) {
        console.log(`   ✅ Table ${tableName} existe déjà`)
        skipped++
        continue
      }

      // Récupérer un échantillon de la source
      const sampleRecord = await this.getSampleRecord(tableName)
      if (!sampleRecord) {
        console.log(`   ⚠️ Aucun échantillon disponible pour ${tableName}`)
        skipped++
        continue
      }

      // Créer la table
      const success = await this.createTableFromSample(tableName, sampleRecord)
      if (success) {
        created++
      } else {
        errors++
      }
    }

    console.log('\n📊 RÉSUMÉ DE LA CRÉATION')
    console.log('='.repeat(30))
    console.log(`✅ Tables créées: ${created}`)
    console.log(`⏭️ Tables ignorées: ${skipped}`)
    console.log(`❌ Erreurs: ${errors}`)

    if (created > 0) {
      console.log('\n🎉 Tables créées avec succès!')
      console.log('🔄 Vous pouvez maintenant relancer le clonage intelligent')
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('Usage: npx tsx scripts/create-missing-tables.ts <source> <target>')
    console.log('Exemple: npx tsx scripts/create-missing-tables.ts prod test')
    process.exit(1)
  }

  const [source, target] = args
  const creator = new TableCreator(source, target)
  
  try {
    await creator.createMissingTables()
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main().catch(console.error)