#!/usr/bin/env tsx
/**
 * SYSTÈME DE SYNCHRONISATION UNIVERSELLE DES SCHÉMAS
 * Synchronise automatiquement les schémas entre tous les environnements
 * Usage: npm run tsx scripts/universal-schema-sync.ts [source] [target]
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

interface TableInfo {
  name: string
  columns: ColumnInfo[]
  exists: boolean
  recordCount: number
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  default: string | null
  position: number
}

interface SyncResult {
  environment: string
  tablesCreated: string[]
  columnsAdded: string[]
  errors: string[]
  sqlScript: string
}

class UniversalSchemaSync {
  private environments: Map<string, Environment> = new Map()
  private masterSchema: TableInfo[] = []

  constructor() {
    this.loadEnvironments()
  }

  private loadEnvironments() {
    const envConfigs = [
      { name: 'prod', file: '.env.production' },
      { name: 'test', file: '.env.test' },
      { name: 'dev', file: '.env.development' }
    ]

    for (const config of envConfigs) {
      try {
        if (existsSync(config.file)) {
          const envContent = readFileSync(config.file, 'utf8')
          const envVars: any = {}
          
          envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=')
            if (key && valueParts.length > 0) {
              envVars[key.trim()] = valueParts.join('=').replace(/"/g, '').trim()
            }
          })

          if (envVars.NEXT_PUBLIC_SUPABASE_URL && envVars.SUPABASE_SERVICE_ROLE_KEY) {
            const env: Environment = {
              name: config.name,
              url: envVars.NEXT_PUBLIC_SUPABASE_URL,
              key: envVars.SUPABASE_SERVICE_ROLE_KEY,
              client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
            }
            this.environments.set(config.name, env)
            console.log(`✅ Environnement ${config.name.toUpperCase()} chargé`)
          }
        }
      } catch (error) {
        console.log(`⚠️ Impossible de charger ${config.name}: ${error}`)
      }
    }
  }

  private inferColumnType(value: any): string {
    if (value === null || value === undefined) return 'text'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'numeric'
    }
    if (typeof value === 'string') {
      // Check if it's a date
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return 'timestamp with time zone'
      }
      // Check if it's a UUID
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return 'uuid'
      }
      return 'text'
    }
    if (typeof value === 'object') return 'jsonb'
    return 'text'
  }

  private async getTableSchema(client: any, tableName: string): Promise<TableInfo> {
    const tableInfo: TableInfo = {
      name: tableName,
      columns: [],
      exists: false,
      recordCount: 0
    }

    try {
      // Vérifier si la table existe en essayant de la requêter
      const { data, error, count } = await client
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (!error) {
        tableInfo.exists = true
        tableInfo.recordCount = count || 0

        // Récupérer la structure des colonnes en analysant un échantillon de données
        if (count && count > 0) {
          const { data: sampleData } = await client
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (sampleData && sampleData.length > 0) {
            const columns = Object.keys(sampleData[0])
            tableInfo.columns = columns.map((col, index) => ({
              name: col,
              type: this.inferColumnType(sampleData[0][col]),
              nullable: sampleData[0][col] === null,
              default: null,
              position: index + 1
            }))
          }
        } else {
          // Pour les tables vides, essayer de récupérer la structure via une requête vide
          try {
            const { data: emptyData, error: emptyError } = await client
              .from(tableName)
              .select('*')
              .limit(0)
            
            if (!emptyError) {
              // Si la requête réussit, la table existe mais est vide
              tableInfo.columns = []
            }
          } catch (e) {
            // Table n'existe probablement pas
          }
        }
      }
    } catch (error) {
      // Table n'existe pas
    }

    return tableInfo
  }

  private async analyzeMasterSchema(sourceEnv: string): Promise<void> {
    console.log(`🔍 Analyse du schéma maître depuis ${sourceEnv.toUpperCase()}`)
    
    const env = this.environments.get(sourceEnv)
    if (!env) {
      throw new Error(`Environnement ${sourceEnv} non trouvé`)
    }

    const expectedTables = [
      'profiles', 'user_sessions', 'zone_areas', 'internet_connection_types',
      'loft_owners', 'lofts', 'categories', 'currencies', 'payment_methods',
      'teams', 'team_members', 'tasks', 'transactions', 'notifications',
      'transaction_category_references', 'settings', 'conversations',
      'conversation_participants', 'messages'
    ]

    this.masterSchema = []

    for (const tableName of expectedTables) {
      const tableInfo = await this.getTableSchema(env.client, tableName)
      this.masterSchema.push(tableInfo)
      
      if (tableInfo.exists) {
        console.log(`✅ ${tableName}: ${tableInfo.columns.length} colonnes, ${tableInfo.recordCount} enregistrements`)
      } else {
        console.log(`⚠️ ${tableName}: Table non trouvée`)
      }
    }
  }

  private async syncEnvironment(targetEnv: string): Promise<SyncResult> {
    console.log(`\n🔄 Synchronisation vers ${targetEnv.toUpperCase()}`)
    console.log('-'.repeat(50))

    const env = this.environments.get(targetEnv)
    if (!env) {
      throw new Error(`Environnement ${targetEnv} non trouvé`)
    }

    const result: SyncResult = {
      environment: targetEnv,
      tablesCreated: [],
      columnsAdded: [],
      errors: [],
      sqlScript: ''
    }

    let sqlScript = `-- =====================================================
-- SYNCHRONISATION AUTOMATIQUE DU SCHÉMA
-- Environnement: ${targetEnv.toUpperCase()}
-- Généré le: ${new Date().toLocaleString('fr-FR')}
-- =====================================================

BEGIN;

`

    for (const masterTable of this.masterSchema) {
      if (!masterTable.exists) continue // Ignorer les tables qui n'existent pas dans le maître

      console.log(`📋 Traitement de ${masterTable.name}...`)

      const targetTable = await this.getTableSchema(env.client, masterTable.name)

      if (!targetTable.exists) {
        // Créer la table complète
        console.log(`   🆕 Création de la table ${masterTable.name}`)
        result.tablesCreated.push(masterTable.name)

        const columns = masterTable.columns
          .sort((a, b) => a.position - b.position)
          .map(col => {
            let colDef = `  ${col.name} ${col.type}`
            if (!col.nullable) colDef += ' NOT NULL'
            if (col.default) colDef += ` DEFAULT ${col.default}`
            return colDef
          })

        sqlScript += `-- Créer la table ${masterTable.name}
CREATE TABLE IF NOT EXISTS ${masterTable.name} (
${columns.join(',\n')}
);

`
      } else {
        // Vérifier les colonnes manquantes
        const targetColumnNames = targetTable.columns.map(c => c.name)
        const missingColumns = masterTable.columns.filter(
          col => !targetColumnNames.includes(col.name)
        )

        for (const missingCol of missingColumns) {
          console.log(`   ➕ Ajout de la colonne ${masterTable.name}.${missingCol.name}`)
          result.columnsAdded.push(`${masterTable.name}.${missingCol.name}`)

          let colDef = missingCol.type
          if (!missingCol.nullable) colDef += ' NOT NULL'
          if (missingCol.default) colDef += ` DEFAULT ${missingCol.default}`

          sqlScript += `-- Ajouter la colonne ${masterTable.name}.${missingCol.name}
ALTER TABLE ${masterTable.name} ADD COLUMN IF NOT EXISTS ${missingCol.name} ${colDef};

`
        }
      }
    }

    // Ajouter les permissions et RLS
    sqlScript += `-- Permissions et RLS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Activer RLS sur toutes les tables
`

    for (const table of this.masterSchema) {
      if (table.exists) {
        sqlScript += `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access to authenticated users" ON ${table.name} FOR ALL USING (auth.uid() IS NOT NULL);
`
      }
    }

    sqlScript += `
COMMIT;

-- =====================================================
-- RÉSUMÉ DE LA SYNCHRONISATION
-- =====================================================
-- Tables créées: ${result.tablesCreated.length}
-- Colonnes ajoutées: ${result.columnsAdded.length}
-- =====================================================
`

    result.sqlScript = sqlScript

    // Sauvegarder le script
    const scriptPath = `sync_to_${targetEnv}_${Date.now()}.sql`
    writeFileSync(scriptPath, sqlScript)
    console.log(`📄 Script généré: ${scriptPath}`)

    return result
  }

  async syncAll(sourceEnv: string = 'prod'): Promise<void> {
    console.log('🌐 SYNCHRONISATION UNIVERSELLE DES SCHÉMAS')
    console.log('='.repeat(60))

    if (!this.environments.has(sourceEnv)) {
      throw new Error(`Environnement source ${sourceEnv} non disponible`)
    }

    // Analyser le schéma maître
    await this.analyzeMasterSchema(sourceEnv)

    const results: SyncResult[] = []

    // Synchroniser tous les autres environnements
    for (const [envName] of this.environments) {
      if (envName !== sourceEnv) {
        try {
          const result = await this.syncEnvironment(envName)
          results.push(result)
        } catch (error) {
          console.log(`❌ Erreur lors de la synchronisation de ${envName}: ${error}`)
        }
      }
    }

    // Rapport final
    console.log('\n📊 RAPPORT FINAL DE SYNCHRONISATION')
    console.log('='.repeat(60))

    for (const result of results) {
      console.log(`\n🎯 ${result.environment.toUpperCase()}:`)
      console.log(`   📋 Tables créées: ${result.tablesCreated.length}`)
      console.log(`   ➕ Colonnes ajoutées: ${result.columnsAdded.length}`)
      console.log(`   ❌ Erreurs: ${result.errors.length}`)

      if (result.tablesCreated.length > 0) {
        console.log(`   📋 Tables: ${result.tablesCreated.join(', ')}`)
      }

      if (result.columnsAdded.length > 0) {
        console.log(`   ➕ Colonnes: ${result.columnsAdded.join(', ')}`)
      }
    }

    // Sauvegarder le rapport complet
    const report = {
      timestamp: new Date().toISOString(),
      sourceEnvironment: sourceEnv,
      results: results,
      masterSchema: this.masterSchema.map(t => ({
        name: t.name,
        exists: t.exists,
        columnCount: t.columns.length,
        recordCount: t.recordCount
      }))
    }

    writeFileSync(`schema_sync_report_${Date.now()}.json`, JSON.stringify(report, null, 2))

    console.log('\n🎉 SYNCHRONISATION UNIVERSELLE TERMINÉE!')
    console.log('📋 Tous les scripts SQL ont été générés')
    console.log('🔧 Exécutez les scripts dans vos environnements cibles')
  }

  async syncSpecific(sourceEnv: string, targetEnv: string): Promise<void> {
    console.log(`🎯 SYNCHRONISATION SPÉCIFIQUE: ${sourceEnv.toUpperCase()} → ${targetEnv.toUpperCase()}`)
    console.log('='.repeat(60))

    if (!this.environments.has(sourceEnv) || !this.environments.has(targetEnv)) {
      throw new Error('Environnements non disponibles')
    }

    await this.analyzeMasterSchema(sourceEnv)
    const result = await this.syncEnvironment(targetEnv)

    console.log('\n📊 RÉSULTAT DE LA SYNCHRONISATION')
    console.log('-'.repeat(40))
    console.log(`📋 Tables créées: ${result.tablesCreated.length}`)
    console.log(`➕ Colonnes ajoutées: ${result.columnsAdded.length}`)
    console.log(`❌ Erreurs: ${result.errors.length}`)

    if (result.tablesCreated.length === 0 && result.columnsAdded.length === 0) {
      console.log('🎉 SCHÉMAS DÉJÀ SYNCHRONISÉS!')
    } else {
      console.log('\n🔧 PROCHAINES ÉTAPES:')
      console.log('1. Examinez le script SQL généré')
      console.log('2. Exécutez le script dans votre environnement cible')
      console.log('3. Testez le clonage des données')
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  const sync = new UniversalSchemaSync()

  if (args.length === 0) {
    // Synchronisation universelle depuis prod
    await sync.syncAll('prod')
  } else if (args.length === 1) {
    // Synchronisation universelle depuis l'environnement spécifié
    await sync.syncAll(args[0])
  } else if (args.length === 2) {
    // Synchronisation spécifique
    await sync.syncSpecific(args[0], args[1])
  } else {
    console.log('📋 Usage:')
    console.log('• npm run tsx scripts/universal-schema-sync.ts                    # Sync depuis prod vers tous')
    console.log('• npm run tsx scripts/universal-schema-sync.ts <source>           # Sync depuis source vers tous')
    console.log('• npm run tsx scripts/universal-schema-sync.ts <source> <target>  # Sync spécifique')
    console.log('')
    console.log('Environnements: prod, test, dev')
  }
}

main().catch(console.error)