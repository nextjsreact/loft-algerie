#!/usr/bin/env tsx
/**
 * RÉCUPÉRATION DES CHAÎNES DE CONNEXION DATABASE
 * Extrait les URLs de connexion PostgreSQL pour export/import
 */

import { readFileSync, existsSync } from 'fs'

interface DatabaseInfo {
  env: string
  supabaseUrl: string
  projectRef: string
  connectionString: string
  dashboardUrl: string
}

function extractProjectRef(supabaseUrl: string): string {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match ? match[1] : 'unknown'
}

function buildConnectionString(supabaseUrl: string, serviceKey: string): string {
  const projectRef = extractProjectRef(supabaseUrl)
  // Note: You'll need to replace [password] with your actual database password
  return `postgresql://postgres:[password]@db.${projectRef}.supabase.co:5432/postgres`
}

function loadEnvironmentInfo(envName: string): DatabaseInfo | null {
  const envFile = envName === 'dev' ? '.env.development' : `.env.${envName}`
  
  if (!existsSync(envFile)) {
    console.log(`⚠️ Fichier ${envFile} non trouvé`)
    return null
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
    console.log(`⚠️ Variables manquantes dans ${envFile}`)
    return null
  }

  const projectRef = extractProjectRef(envVars.NEXT_PUBLIC_SUPABASE_URL)
  
  return {
    env: envName.toUpperCase(),
    supabaseUrl: envVars.NEXT_PUBLIC_SUPABASE_URL,
    projectRef: projectRef,
    connectionString: buildConnectionString(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY),
    dashboardUrl: `https://supabase.com/dashboard/project/${projectRef}`
  }
}

function main() {
  console.log('🔗 INFORMATIONS DE CONNEXION DATABASE')
  console.log('='.repeat(60))

  const environments = ['prod', 'test', 'dev']
  const dbInfos: DatabaseInfo[] = []

  for (const env of environments) {
    const info = loadEnvironmentInfo(env)
    if (info) {
      dbInfos.push(info)
    }
  }

  if (dbInfos.length === 0) {
    console.log('❌ Aucune information de base de données trouvée')
    return
  }

  // Afficher les informations
  dbInfos.forEach(info => {
    console.log(`\n📋 ${info.env}`)
    console.log(`   Project Ref: ${info.projectRef}`)
    console.log(`   Supabase URL: ${info.supabaseUrl}`)
    console.log(`   Dashboard: ${info.dashboardUrl}`)
    console.log(`   Connection String: ${info.connectionString}`)
  })

  console.log('\n🔧 COMMANDES D\'EXPORT/IMPORT')
  console.log('='.repeat(40))

  const prodInfo = dbInfos.find(info => info.env === 'PROD')
  const testInfo = dbInfos.find(info => info.env === 'TEST')

  if (prodInfo && testInfo) {
    console.log('\n📤 EXPORT DEPUIS PROD:')
    console.log(`pg_dump "${prodInfo.connectionString}" > prod_backup.sql`)
    console.log('\n📥 IMPORT VERS TEST:')
    console.log(`psql "${testInfo.connectionString}" < prod_backup.sql`)
    
    console.log('\n🔄 COMMANDE COMPLÈTE (avec nettoyage):')
    console.log(`# 1. Export PROD`)
    console.log(`pg_dump "${prodInfo.connectionString}" > prod_backup.sql`)
    console.log(`# 2. Nettoyer TEST (optionnel)`)
    console.log(`psql "${testInfo.connectionString}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`)
    console.log(`# 3. Import vers TEST`)
    console.log(`psql "${testInfo.connectionString}" < prod_backup.sql`)
  }

  console.log('\n📋 ALTERNATIVE: SUPABASE CLI')
  console.log('='.repeat(30))
  console.log('# Installer Supabase CLI')
  console.log('npm install -g supabase')
  console.log('# Login')
  console.log('supabase login')
  
  if (prodInfo) {
    console.log('# Export PROD')
    console.log(`supabase db dump --project-ref ${prodInfo.projectRef} > prod_backup.sql`)
  }
  
  if (testInfo) {
    console.log('# Import vers TEST')
    console.log(`supabase db reset --project-ref ${testInfo.projectRef} --file prod_backup.sql`)
  }

  console.log('\n⚠️ IMPORTANT:')
  console.log('• Remplacez [password] par votre mot de passe database réel')
  console.log('• Le mot de passe database se trouve dans Settings > Database de votre dashboard Supabase')
  console.log('• Sauvegardez TEST avant l\'import si nécessaire')
  console.log('• Cette opération écrasera complètement la base TEST')
}

main()