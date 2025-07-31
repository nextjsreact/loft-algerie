#!/usr/bin/env tsx
/**
 * EXPORT COMPLET DE BASE DE DONNÉES
 * Usage: npm run tsx scripts/export-database.ts <env>
 * Exemple: npm run tsx scripts/export-database.ts prod
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

interface ExportOptions {
  environment: 'prod' | 'test' | 'dev'
  includeData: boolean
  includeSchema: boolean
  excludeTables?: string[]
  anonymizeData?: boolean
}

class DatabaseExporter {
  private client: any
  private environment: string
  private timestamp: string
  private exportDir: string

  constructor(private options: ExportOptions) {
    this.environment = options.environment
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19)
    this.exportDir = './exports'
    
    // Créer le dossier d'export s'il n'existe pas
    if (!existsSync(this.exportDir)) {
      mkdirSync(this.exportDir, { recursive: true })
    }
  }

  private async initializeClient() {
    console.log(`🔗 Connexion à l'environnement ${this.environment.toUpperCase()}...`)
    
    // Charger la configuration d'environnement
    const envFile = `.env.${this.environment === 'dev' ? 'development' : this.environment}`
    
    if (!existsSync(envFile)) {
      throw new Error(`❌ Fichier d'environnement ${envFile} non trouvé`)
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
      throw new Error('❌ Variables Supabase manquantes dans le fichier d\'environnement')
    }

    this.client = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log(`✅ Connexion établie: ${envVars.NEXT_PUBLIC_SUPABASE_URL}`)
  }

  private async getTablesList(): Promise<string[]> {
    console.log('📋 Récupération de la liste des tables...')
    
    // Tables principales à exporter (dans l'ordre des dépendances)
    const tables = [
      // Tables de configuration
      'currencies',
      'categories',
      'zone_areas', 
      'internet_connection_types',
      'payment_methods',
      
      // Tables de base
      'loft_owners',
      'lofts',
      
      // Tables utilisateurs
      'profiles',
      
      // Tables de gestion
      'teams',
      'team_members',
      'tasks',
      
      // Tables transactionnelles
      'transactions',
      'transaction_category_references',
      
      // Tables de communication
      'conversations',
      'conversation_participants',
      'messages',
      'notifications',
      
      // Configuration système
      'settings'
    ]

    // Filtrer les tables exclues
    const filteredTables = tables.filter(table => 
      !this.options.excludeTables?.includes(table)
    )

    console.log(`📊 ${filteredTables.length} tables à exporter`)
    return filteredTables
  }

  private anonymizeData(tableName: string, data: any[]): any[] {
    if (!this.options.anonymizeData) return data

    console.log(`🔒 Anonymisation des données de ${tableName}...`)

    switch (tableName) {
      case 'profiles':
        return data.map(record => ({
          ...record,
          email: `user${Math.random().toString(36).substr(2, 5)}@${this.environment}.local`,
          full_name: `User ${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
          airbnb_access_token: null,
          airbnb_refresh_token: null
        }))

      case 'loft_owners':
        return data.map(record => ({
          ...record,
          email: record.email ? `owner${Math.random().toString(36).substr(2, 3)}@${this.environment}.local` : null,
          phone: record.phone ? '+213XXXXXXXX' : null,
          address: 'Adresse anonymisée'
        }))

      case 'messages':
        return data.map(record => ({
          ...record,
          content: 'Message anonymisé pour export'
        }))

      case 'notifications':
        return data.map(record => ({
          ...record,
          message: 'Notification anonymisée pour export'
        }))

      default:
        return data
    }
  }

  private async exportTableData(tableName: string): Promise<any> {
    try {
      console.log(`📤 Export de ${tableName}...`)

      // Récupérer toutes les données de la table
      const { data, error, count } = await this.client
        .from(tableName)
        .select('*', { count: 'exact' })

      if (error) {
        console.log(`⚠️ Erreur ${tableName}: ${error.message}`)
        return {
          table: tableName,
          status: 'error',
          error: error.message,
          records: 0,
          data: []
        }
      }

      if (!data || data.length === 0) {
        console.log(`ℹ️ ${tableName}: Table vide`)
        return {
          table: tableName,
          status: 'empty',
          records: 0,
          data: []
        }
      }

      // Anonymiser si nécessaire
      const processedData = this.anonymizeData(tableName, data)

      console.log(`✅ ${tableName}: ${count} enregistrements exportés`)
      return {
        table: tableName,
        status: 'success',
        records: count || 0,
        data: processedData
      }

    } catch (error) {
      console.log(`💥 Erreur inattendue ${tableName}: ${error}`)
      return {
        table: tableName,
        status: 'error',
        error: error.toString(),
        records: 0,
        data: []
      }
    }
  }

  async exportDatabase(): Promise<void> {
    console.log('🚀 DÉBUT DE L\'EXPORT DE BASE DE DONNÉES')
    console.log('=' .repeat(60))
    console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`)
    console.log(`🎯 Environnement: ${this.environment.toUpperCase()}`)
    console.log(`📁 Dossier d'export: ${this.exportDir}`)
    console.log('')

    await this.initializeClient()

    const tables = await this.getTablesList()
    const exportResults: any[] = []
    let totalRecords = 0

    // Export de chaque table
    for (const tableName of tables) {
      const result = await this.exportTableData(tableName)
      exportResults.push(result)
      
      if (result.status === 'success') {
        totalRecords += result.records
      }
    }

    // Créer le fichier d'export principal
    const exportData = {
      metadata: {
        environment: this.environment,
        timestamp: new Date().toISOString(),
        exported_by: 'Database Export Script',
        total_tables: tables.length,
        total_records: totalRecords,
        anonymized: this.options.anonymizeData || false,
        version: '1.0'
      },
      tables: exportResults.reduce((acc, result) => {
        acc[result.table] = {
          status: result.status,
          records: result.records,
          data: result.data
        }
        return acc
      }, {})
    }

    // Nom du fichier d'export
    const filename = `${this.environment}_database_export_${this.timestamp}.json`
    const filepath = `${this.exportDir}/${filename}`

    // Sauvegarder l'export
    writeFileSync(filepath, JSON.stringify(exportData, null, 2))

    // Créer aussi un résumé
    const summary = {
      export_file: filename,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      summary: {
        total_tables: tables.length,
        successful_exports: exportResults.filter(r => r.status === 'success').length,
        empty_tables: exportResults.filter(r => r.status === 'empty').length,
        failed_exports: exportResults.filter(r => r.status === 'error').length,
        total_records: totalRecords
      },
      tables_detail: exportResults.map(r => ({
        table: r.table,
        status: r.status,
        records: r.records,
        error: r.error || null
      }))
    }

    const summaryFilename = `${this.environment}_export_summary_${this.timestamp}.json`
    const summaryFilepath = `${this.exportDir}/${summaryFilename}`
    writeFileSync(summaryFilepath, JSON.stringify(summary, null, 2))

    // Rapport final
    console.log('\n📊 RÉSUMÉ DE L\'EXPORT')
    console.log('=' .repeat(50))
    console.log(`📁 Fichier principal: ${filename}`)
    console.log(`📋 Fichier résumé: ${summaryFilename}`)
    console.log(`📈 Total des enregistrements: ${totalRecords}`)
    console.log(`✅ Tables réussies: ${summary.summary.successful_exports}`)
    console.log(`ℹ️ Tables vides: ${summary.summary.empty_tables}`)
    console.log(`❌ Tables en erreur: ${summary.summary.failed_exports}`)

    console.log('\n📋 Détail par table:')
    exportResults.forEach(result => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'empty' ? 'ℹ️' : '❌'
      console.log(`${icon} ${result.table}: ${result.records} enregistrements`)
    })

    console.log(`\n🎉 EXPORT TERMINÉ!`)
    console.log(`💾 Fichiers sauvegardés dans: ${this.exportDir}/`)
    
    if (this.options.anonymizeData) {
      console.log('🔒 Données anonymisées pour la sécurité')
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('📋 Usage: npm run tsx scripts/export-database.ts <environment> [options]')
    console.log('')
    console.log('Environnements disponibles: prod, test, dev')
    console.log('')
    console.log('Options:')
    console.log('  --anonymize     Anonymiser les données sensibles')
    console.log('  --exclude-auth  Exclure les tables d\'authentification')
    console.log('')
    console.log('Exemples:')
    console.log('• npm run tsx scripts/export-database.ts prod')
    console.log('• npm run tsx scripts/export-database.ts test --anonymize')
    console.log('• npm run tsx scripts/export-database.ts dev --exclude-auth')
    return
  }

  const environment = args[0] as 'prod' | 'test' | 'dev'
  
  if (!['prod', 'test', 'dev'].includes(environment)) {
    console.log('❌ Environnement non valide. Utilisez: prod, test, ou dev')
    return
  }

  const options: ExportOptions = {
    environment,
    includeData: true,
    includeSchema: true,
    anonymizeData: args.includes('--anonymize'),
    excludeTables: args.includes('--exclude-auth') ? ['profiles'] : undefined
  }

  // Confirmation pour la production
  if (environment === 'prod') {
    const { createInterface } = await import('readline')
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })

    console.log('⚠️ ATTENTION: Vous allez exporter la base de données de PRODUCTION!')
    const confirm = await new Promise(resolve => {
      rl.question('Confirmez-vous l\'export? (tapez OUI): ', resolve)
    })
    rl.close()

    if (confirm !== 'OUI') {
      console.log('❌ Export annulé')
      return
    }
  }

  const exporter = new DatabaseExporter(options)
  await exporter.exportDatabase()
}

main().catch(console.error)