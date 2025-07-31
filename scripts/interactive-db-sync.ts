#!/usr/bin/env tsx
/**
 * SYNCHRONISATION INTERACTIVE DE BASE DE DONNÉES
 * Guide interactif pour l'export/import de base de données
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
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

async function main() {
  console.log('🗄️ SYNCHRONISATION INTERACTIVE DE BASE DE DONNÉES')
  console.log('='.repeat(60))
  console.log('')
  console.log('Cette opération va:')
  console.log('1. ✅ Exporter la base PROD complète')
  console.log('2. ✅ Importer vers TEST (écrasement complet)')
  console.log('3. ✅ Résoudre tous les problèmes de synchronisation')
  console.log('')

  const confirm = await question('Voulez-vous continuer? (y/N): ')
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    console.log('❌ Opération annulée')
    rl.close()
    return
  }

  console.log('\n📋 INFORMATIONS REQUISES')
  console.log('Vous devez récupérer les mots de passe database depuis:')
  console.log('• PROD: https://supabase.com/dashboard/project/mhngbluefyucoesgcjoy/settings/database')
  console.log('• TEST: https://supabase.com/dashboard/project/sxphlwvjxzxvbdzriziy/settings/database')
  console.log('')

  const prodPassword = await question('Mot de passe PROD database: ')
  if (!prodPassword.trim()) {
    console.log('❌ Mot de passe PROD requis')
    rl.close()
    return
  }

  const testPassword = await question('Mot de passe TEST database: ')
  if (!testPassword.trim()) {
    console.log('❌ Mot de passe TEST requis')
    rl.close()
    return
  }

  console.log('\n🚀 DÉBUT DE LA SYNCHRONISATION')
  console.log('='.repeat(40))

  try {
    // Étape 1: Export PROD
    console.log('\n📤 1. Export de la base PROD...')
    const exportCmd = `pg_dump "postgresql://postgres:${prodPassword}@db.mhngbluefyucoesgcjoy.supabase.co:5432/postgres" -f prod_backup.sql`
    
    console.log('   Commande: pg_dump [connection_string] -f prod_backup.sql')
    execSync(exportCmd, { stdio: 'inherit' })
    
    if (!existsSync('prod_backup.sql')) {
      throw new Error('Le fichier de sauvegarde n\'a pas été créé')
    }
    
    console.log('   ✅ Export PROD terminé')

    // Étape 2: Nettoyage TEST (optionnel)
    console.log('\n🧹 2. Nettoyage de la base TEST...')
    const cleanCmd = `psql "postgresql://postgres:${testPassword}@db.sxphlwvjxzxvbdzriziy.supabase.co:5432/postgres" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role; GRANT ALL ON SCHEMA public TO postgres, service_role;"`
    
    console.log('   Commande: psql [connection_string] -c "DROP SCHEMA..."')
    execSync(cleanCmd, { stdio: 'inherit' })
    console.log('   ✅ Nettoyage TEST terminé')

    // Étape 3: Import vers TEST
    console.log('\n📥 3. Import vers la base TEST...')
    const importCmd = `psql "postgresql://postgres:${testPassword}@db.sxphlwvjxzxvbdzriziy.supabase.co:5432/postgres" -f prod_backup.sql`
    
    console.log('   Commande: psql [connection_string] -f prod_backup.sql')
    execSync(importCmd, { stdio: 'inherit' })
    console.log('   ✅ Import TEST terminé')

    console.log('\n🎉 SYNCHRONISATION TERMINÉE AVEC SUCCÈS!')
    console.log('='.repeat(50))
    console.log('✅ Base PROD exportée')
    console.log('✅ Base TEST nettoyée')  
    console.log('✅ Données importées vers TEST')
    console.log('')
    console.log('🔍 Vérification recommandée:')
    console.log('npx tsx scripts/complete-sync-diagnosis.ts')

  } catch (error) {
    console.error('\n❌ ERREUR DURANT LA SYNCHRONISATION:')
    console.error(error)
    console.log('\n🔧 SOLUTIONS POSSIBLES:')
    console.log('• Vérifiez que les mots de passe sont corrects')
    console.log('• Vérifiez votre connexion internet')
    console.log('• Vérifiez que votre IP est autorisée dans Supabase')
    console.log('• Essayez de relancer la commande')
  } finally {
    rl.close()
  }
}

main().catch(console.error)