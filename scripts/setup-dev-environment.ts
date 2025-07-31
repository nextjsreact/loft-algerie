#!/usr/bin/env tsx
/**
 * CONFIGURATION DE L'ENVIRONNEMENT DE DÉVELOPPEMENT
 * Guide interactif pour configurer l'environnement DEV
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey: string
}

class DevEnvironmentSetup {
  private devConfig?: SupabaseConfig

  async setupDevEnvironment(): Promise<void> {
    console.log('🛠️ CONFIGURATION DE L\'ENVIRONNEMENT DE DÉVELOPPEMENT')
    console.log('='.repeat(60))
    console.log('')
    console.log('Cette configuration va:')
    console.log('1. ✅ Configurer les credentials Supabase pour DEV')
    console.log('2. ✅ Tester la connexion')
    console.log('3. ✅ Synchroniser les données depuis PROD')
    console.log('4. ✅ Vérifier que tout fonctionne')
    console.log('')

    const proceed = await question('Voulez-vous continuer? (y/N): ')
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      console.log('❌ Configuration annulée')
      return
    }

    await this.getSupabaseCredentials()
    await this.updateEnvFile()
    await this.testConnection()
    await this.syncWithProd()
    
    console.log('\n🎉 CONFIGURATION DEV TERMINÉE!')
    console.log('='.repeat(40))
    console.log('✅ Environnement DEV configuré')
    console.log('✅ Connexion testée')
    console.log('✅ Données synchronisées')
    console.log('')
    console.log('🔍 Vérification finale:')
    console.log('npx tsx scripts/complete-sync-diagnosis.ts')
  }

  private async getSupabaseCredentials(): Promise<void> {
    console.log('\n📋 CONFIGURATION SUPABASE')
    console.log('='.repeat(30))
    console.log('')
    console.log('Vous avez deux options:')
    console.log('1. 🆕 Créer un nouveau projet Supabase pour DEV')
    console.log('2. 🔄 Utiliser un projet Supabase existant')
    console.log('')
    console.log('💡 Recommandation: Créer un nouveau projet pour isoler DEV')
    console.log('')

    const choice = await question('Avez-vous déjà un projet Supabase pour DEV? (y/N): ')
    
    if (choice.toLowerCase() === 'y' || choice.toLowerCase() === 'yes') {
      await this.useExistingProject()
    } else {
      await this.createNewProject()
    }
  }

  private async useExistingProject(): Promise<void> {
    console.log('\n🔗 UTILISATION D\'UN PROJET EXISTANT')
    console.log('='.repeat(40))
    console.log('')
    console.log('Récupérez les informations depuis votre dashboard Supabase:')
    console.log('• Allez sur https://supabase.com/dashboard')
    console.log('• Sélectionnez votre projet DEV')
    console.log('• Settings → API')
    console.log('')

    const url = await question('URL du projet (https://xxx.supabase.co): ')
    const anonKey = await question('Anon key: ')
    const serviceRoleKey = await question('Service role key: ')

    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error('❌ Toutes les informations sont requises')
    }

    this.devConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      serviceRoleKey: serviceRoleKey.trim()
    }
  }

  private async createNewProject(): Promise<void> {
    console.log('\n🆕 CRÉATION D\'UN NOUVEAU PROJET')
    console.log('='.repeat(40))
    console.log('')
    console.log('📋 ÉTAPES À SUIVRE:')
    console.log('1. Allez sur https://supabase.com/dashboard')
    console.log('2. Cliquez sur "New Project"')
    console.log('3. Choisissez un nom (ex: "loft-algerie-dev")')
    console.log('4. Choisissez un mot de passe database')
    console.log('5. Sélectionnez une région (Europe West recommandée)')
    console.log('6. Cliquez sur "Create new project"')
    console.log('7. Attendez que le projet soit créé (2-3 minutes)')
    console.log('')

    await question('Appuyez sur Entrée quand le projet est créé...')

    console.log('\n📋 RÉCUPÉRATION DES CREDENTIALS:')
    console.log('1. Dans votre nouveau projet → Settings → API')
    console.log('2. Copiez les informations ci-dessous')
    console.log('')

    const url = await question('URL du projet (https://xxx.supabase.co): ')
    const anonKey = await question('Anon key: ')
    const serviceRoleKey = await question('Service role key: ')

    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error('❌ Toutes les informations sont requises')
    }

    this.devConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      serviceRoleKey: serviceRoleKey.trim()
    }
  }

  private async updateEnvFile(): Promise<void> {
    console.log('\n📝 MISE À JOUR DU FICHIER .env.development')
    console.log('='.repeat(50))

    if (!this.devConfig) {
      throw new Error('❌ Configuration manquante')
    }

    // Lire le fichier existant
    const envFile = '.env.development'
    let envContent = ''
    
    if (existsSync(envFile)) {
      envContent = readFileSync(envFile, 'utf8')
    }

    // Remplacer les placeholders
    const updatedContent = envContent
      .replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${this.devConfig.url}`)
      .replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${this.devConfig.anonKey}`)
      .replace(/SUPABASE_SERVICE_ROLE_KEY=.*/, `SUPABASE_SERVICE_ROLE_KEY="${this.devConfig.serviceRoleKey}"`)

    // Écrire le fichier mis à jour
    writeFileSync(envFile, updatedContent)
    
    console.log('✅ Fichier .env.development mis à jour')
  }

  private async testConnection(): Promise<void> {
    console.log('\n🔍 TEST DE CONNEXION')
    console.log('='.repeat(30))

    if (!this.devConfig) {
      throw new Error('❌ Configuration manquante')
    }

    try {
      const client = createClient(this.devConfig.url, this.devConfig.serviceRoleKey)
      
      // Test simple de connexion
      const { data, error } = await client
        .from('profiles')
        .select('count')
        .limit(1)

      if (error && !error.message.includes('relation "profiles" does not exist')) {
        throw new Error(`Erreur de connexion: ${error.message}`)
      }

      console.log('✅ Connexion Supabase réussie')
      
    } catch (error) {
      console.log(`❌ Erreur de connexion: ${error}`)
      throw error
    }
  }

  private async syncWithProd(): Promise<void> {
    console.log('\n🔄 SYNCHRONISATION AVEC PROD')
    console.log('='.repeat(40))

    const syncChoice = await question('Voulez-vous synchroniser les données depuis PROD? (Y/n): ')
    
    if (syncChoice.toLowerCase() === 'n' || syncChoice.toLowerCase() === 'no') {
      console.log('⏭️ Synchronisation ignorée')
      return
    }

    console.log('🚀 Lancement de la synchronisation...')
    
    try {
      // Utiliser notre script de synchronisation existant
      const { execSync } = require('child_process')
      execSync('npx tsx scripts/complete-table-sync.ts prod dev', { stdio: 'inherit' })
      
      console.log('✅ Synchronisation terminée')
    } catch (error) {
      console.log('⚠️ Synchronisation partielle - certaines tables peuvent nécessiter une attention manuelle')
    }
  }
}

async function main() {
  const setup = new DevEnvironmentSetup()
  
  try {
    await setup.setupDevEnvironment()
  } catch (error) {
    console.error('\n❌ ERREUR DURANT LA CONFIGURATION:')
    console.error(error)
    console.log('\n🔧 SOLUTIONS:')
    console.log('• Vérifiez que les credentials Supabase sont corrects')
    console.log('• Vérifiez votre connexion internet')
    console.log('• Relancez la configuration si nécessaire')
  } finally {
    rl.close()
  }
}

main().catch(console.error)