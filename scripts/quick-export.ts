#!/usr/bin/env tsx
/**
 * EXPORT RAPIDE - Version simplifiée
 * Usage: npm run tsx scripts/quick-export.ts <env>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'

async function quickExport(env: string) {
  console.log(`⚡ EXPORT RAPIDE - ${env.toUpperCase()}`)
  console.log('=' .repeat(40))

  // Créer le dossier exports
  if (!existsSync('./exports')) {
    mkdirSync('./exports', { recursive: true })
  }

  // Charger la config
  const envFile = `.env.${env === 'dev' ? 'development' : env}`
  const envContent = readFileSync(envFile, 'utf8')
  const envVars: any = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
    }
  })

  const client = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  )

  // Tables essentielles
  const tables = ['lofts', 'loft_owners', 'profiles', 'transactions', 'currencies', 'categories']
  const exportData: any = {
    environment: env,
    timestamp: new Date().toISOString(),
    tables: {}
  }

  let totalRecords = 0

  for (const table of tables) {
    try {
      console.log(`📤 ${table}...`)
      const { data, error, count } = await client
        .from(table)
        .select('*', { count: 'exact' })

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        exportData.tables[table] = { error: error.message, records: 0 }
      } else {
        const records = count || 0
        totalRecords += records
        exportData.tables[table] = { data: data || [], records }
        console.log(`✅ ${table}: ${records} enregistrements`)
      }
    } catch (error) {
      console.log(`💥 ${table}: ${error}`)
      exportData.tables[table] = { error: error.toString(), records: 0 }
    }
  }

  // Sauvegarder
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19)
  const filename = `${env}_quick_export_${timestamp}.json`
  const filepath = `./exports/${filename}`

  writeFileSync(filepath, JSON.stringify(exportData, null, 2))

  console.log('')
  console.log(`🎉 Export terminé!`)
  console.log(`📁 Fichier: ${filename}`)
  console.log(`📊 Total: ${totalRecords} enregistrements`)
}

// Exécution
const env = process.argv[2]
if (!env || !['prod', 'test', 'dev'].includes(env)) {
  console.log('Usage: npm run tsx scripts/quick-export.ts <prod|test|dev>')
  process.exit(1)
}

quickExport(env).catch(console.error)