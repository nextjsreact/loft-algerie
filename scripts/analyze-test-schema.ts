#!/usr/bin/env tsx
/**
 * ANALYSE DU SCHÉMA TEST
 * Examine la structure des tables TEST pour comprendre les contraintes
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

class SchemaAnalyzer {
  private testEnv!: Environment

  constructor() {}

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

  private async initializeEnvironment(): Promise<void> {
    console.log(`🔍 Analyse du schéma TEST`)
    
    this.testEnv = this.loadEnvironment('test')
    
    console.log(`✅ Connexion établie`)
  }

  private async analyzeProfiles(): Promise<void> {
    console.log('\n👥 ANALYSE DE LA TABLE PROFILES')
    console.log('='.repeat(40))

    try {
      // Essayer d'insérer un profil test pour voir les erreurs
      const testProfile = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('🧪 Test d\'insertion avec role "admin"...')
      const { error: adminError } = await this.testEnv.client
        .from('profiles')
        .insert([testProfile])

      if (adminError) {
        console.log(`❌ Erreur avec "admin": ${adminError.message}`)
      } else {
        console.log(`✅ "admin" accepté`)
        // Nettoyer
        await this.testEnv.client.from('profiles').delete().eq('id', testProfile.id)
      }

      // Tester d'autres rôles
      const rolesToTest = ['user', 'authenticated', 'anon', 'service_role', 'manager', 'employee']
      
      for (const role of rolesToTest) {
        const testProfileRole = { ...testProfile, id: `00000000-0000-0000-0000-00000000000${rolesToTest.indexOf(role) + 2}`, role }
        
        console.log(`🧪 Test d'insertion avec role "${role}"...`)
        const { error } = await this.testEnv.client
          .from('profiles')
          .insert([testProfileRole])

        if (error) {
          console.log(`❌ Erreur avec "${role}": ${error.message}`)
        } else {
          console.log(`✅ "${role}" accepté`)
          // Nettoyer
          await this.testEnv.client.from('profiles').delete().eq('id', testProfileRole.id)
        }
      }

    } catch (error) {
      console.log(`❌ Erreur générale: ${error}`)
    }
  }

  private async analyzeExistingData(): Promise<void> {
    console.log('\n📊 ANALYSE DES DONNÉES EXISTANTES')
    console.log('='.repeat(40))

    const tables = ['profiles', 'loft_owners', 'transaction_category_references', 'settings']

    for (const tableName of tables) {
      try {
        const { data, error } = await this.testEnv.client
          .from(tableName)
          .select('*')
          .limit(3)

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else {
          console.log(`\n📋 ${tableName}:`)
          if (data && data.length > 0) {
            console.log(`   📊 ${data.length} enregistrements trouvés`)
            console.log(`   🔑 Colonnes: ${Object.keys(data[0]).join(', ')}`)
            
            // Afficher un échantillon
            data.forEach((record, index) => {
              console.log(`   📄 Enregistrement ${index + 1}:`, JSON.stringify(record, null, 2).substring(0, 200) + '...')
            })
          } else {
            console.log(`   ℹ️ Table vide`)
          }
        }
      } catch (error) {
        console.log(`❌ ${tableName}: Erreur - ${error}`)
      }
    }
  }

  async analyze(): Promise<void> {
    console.log('🔍 ANALYSE COMPLÈTE DU SCHÉMA TEST')
    console.log('='.repeat(50))

    await this.initializeEnvironment()
    await this.analyzeProfiles()
    await this.analyzeExistingData()

    console.log('\n💡 RECOMMANDATIONS:')
    console.log('• Vérifiez les enum values acceptés pour user_role')
    console.log('• Vérifiez si profiles.id doit référencer auth.users')
    console.log('• Considérez utiliser les IDs existants dans TEST')
  }
}

// Interface en ligne de commande
async function main() {
  const analyzer = new SchemaAnalyzer()
  
  try {
    await analyzer.analyze()
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main().catch(console.error)