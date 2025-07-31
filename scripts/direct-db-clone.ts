#!/usr/bin/env tsx
/**
 * CLONAGE DIRECT VIA POSTGRESQL
 * Utilise pg_dump/psql directement avec gestion des erreurs
 */

import { execSync } from 'child_process'
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

class DirectDatabaseClone {
  private prodPassword?: string
  private testPassword?: string
  private devPassword?: string

  async cloneDatabase(): Promise<void> {
    console.log('🗄️ CLONAGE DIRECT DE BASE DE DONNÉES')
    console.log('='.repeat(50))
    console.log('')
    console.log('Cette méthode va:')
    console.log('1. ✅ Exporter PROD avec pg_dump')
    console.log('2. ✅ Importer vers TEST avec psql')
    console.log('3. ✅ Importer vers DEV avec psql')
    console.log('4. ✅ Résoudre tous les problèmes de schéma')
    console.log('')

    const proceed = await question('Voulez-vous continuer? (y/N): ')
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      console.log('❌ Clonage annulé')
      return
    }

    await this.getPasswords()
    await this.exportProd()
    await this.importToTest()
    await this.importToDev()
    
    console.log('\n🎉 CLONAGE TERMINÉ!')
    console.log('🔍 Vérifiez avec: npx tsx scripts/complete-sync-diagnosis.ts')
  }

  private async getPasswords(): Promise<void> {
    console.log('\n🔑 MOTS DE PASSE DATABASE')
    console.log('='.repeat(30))
    console.log('Récupérez les mots de passe depuis:')
    console.log('• PROD: https://supabase.com/dashboard/project/mhngbluefyucoesgcjoy/settings/database')
    console.log('• TEST: https://supabase.com/dashboard/project/sxphlwvjxzxvbdzriziy/settings/database')
    console.log('• DEV: https://supabase.com/dashboard/project/wtcbyjdwjrrqyzpvjfze/settings/database')
    console.log('')

    this.prodPassword = await question('Mot de passe PROD database: ')
    this.testPassword = await question('Mot de passe TEST database: ')
    this.devPassword = await question('Mot de passe DEV database: ')

    if (!this.prodPassword || !this.testPassword || !this.devPassword) {
      throw new Error('❌ Tous les mots de passe sont requis')
    }
  }

  private async exportProd(): Promise<void> {
    console.log('\n📤 EXPORT DE LA BASE PROD')
    console.log('='.repeat(30))

    try {
      // Encoder le mot de passe pour l'URL
      const encodedPassword = encodeURIComponent(this.prodPassword!)
      const connectionString = `postgresql://postgres:${encodedPassword}@db.mhngbluefyucoesgcjoy.supabase.co:5432/postgres`
      
      console.log('🔄 Export en cours...')
      const exportCmd = `pg_dump "${connectionString}" -f prod_complete_backup.sql --verbose --no-owner --no-privileges`
      
      execSync(exportCmd, { stdio: 'inherit' })
      console.log('✅ Export PROD terminé')
      
    } catch (error) {
      console.log('❌ Erreur export PROD:', error)
      throw error
    }
  }

  private async importToTest(): Promise<void> {
    console.log('\n📥 IMPORT VERS TEST')
    console.log('='.repeat(25))

    try {
      const encodedPassword = encodeURIComponent(this.testPassword!)
      const connectionString = `postgresql://postgres:${encodedPassword}@db.sxphlwvjxzxvbdzriziy.supabase.co:5432/postgres`
      
      console.log('🧹 Nettoyage TEST...')
      const cleanCmd = `psql "${connectionString}" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role; GRANT ALL ON SCHEMA public TO postgres, service_role;"`
      execSync(cleanCmd, { stdio: 'inherit' })
      
      console.log('🔄 Import en cours...')
      const importCmd = `psql "${connectionString}" -f prod_complete_backup.sql --quiet`
      execSync(importCmd, { stdio: 'inherit' })
      
      console.log('✅ Import TEST terminé')
      
    } catch (error) {
      console.log('❌ Erreur import TEST:', error)
      throw error
    }
  }

  private async importToDev(): Promise<void> {
    console.log('\n📥 IMPORT VERS DEV')
    console.log('='.repeat(24))

    try {
      const encodedPassword = encodeURIComponent(this.devPassword!)
      const connectionString = `postgresql://postgres:${encodedPassword}@db.wtcbyjdwjrrqyzpvjfze.supabase.co:5432/postgres`
      
      console.log('🧹 Nettoyage DEV...')
      const cleanCmd = `psql "${connectionString}" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role; GRANT ALL ON SCHEMA public TO postgres, service_role;"`
      execSync(cleanCmd, { stdio: 'inherit' })
      
      console.log('🔄 Import en cours...')
      const importCmd = `psql "${connectionString}" -f prod_complete_backup.sql --quiet`
      execSync(importCmd, { stdio: 'inherit' })
      
      console.log('✅ Import DEV terminé')
      
    } catch (error) {
      console.log('❌ Erreur import DEV:', error)
      throw error
    }
  }
}

async function main() {
  const cloner = new DirectDatabaseClone()
  
  try {
    await cloner.cloneDatabase()
  } catch (error) {
    console.error('\n❌ ERREUR DURANT LE CLONAGE:')
    console.error(error)
    console.log('\n🔧 SOLUTIONS:')
    console.log('• Vérifiez que les mots de passe sont corrects')
    console.log('• Vérifiez votre connexion internet')
    console.log('• Utilisez la méthode Supabase Dashboard en alternative')
  } finally {
    rl.close()
  }
}

main().catch(console.error)