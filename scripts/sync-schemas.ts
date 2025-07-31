#!/usr/bin/env tsx
/**
 * SYNCHRONISATION DES SCHÉMAS ENTRE ENVIRONNEMENTS
 * Usage: npm run tsx scripts/sync-schemas.ts <source> <target>
 * Exemple: npm run tsx scripts/sync-schemas.ts prod test
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'

interface SchemaInfo {
  tables: { [tableName: string]: TableSchema }
  environment: string
  timestamp: string
}

interface TableSchema {
  columns: { [columnName: string]: ColumnInfo }
  indexes: string[]
  constraints: string[]
}

interface ColumnInfo {
  data_type: string
  is_nullable: string
  column_default: string | null
  character_maximum_length: number | null
  ordinal_position: number
}

class SchemaSynchronizer {
  private sourceClient: any
  private targetClient: any
  
  constructor(
    private sourceEnv: string,
    private targetEnv: string
  ) {}

  private async initializeClients() {
    console.log(`🔗 Connexion aux environnements ${this.sourceEnv.toUpperCase()} → ${this.targetEnv.toUpperCase()}`)
    
    // Charger source
    const sourceConfig = await this.loadEnvironment(this.sourceEnv)
    this.sourceClient = createClient(sourceConfig.url, sourceConfig.key)
    
    // Charger target
    const targetConfig = await this.loadEnvironment(this.targetEnv)
    this.targetClient = createClient(targetConfig.url, targetConfig.key)
    
    console.log(`✅ Connexions établies`)
  }

  private async loadEnvironment(env: string) {
    const envFile = `.env.${env === 'dev' ? 'development' : env}`
    
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
      url: envVars.NEXT_PUBLIC_SUPABASE_URL,
      key: envVars.SUPABASE_SERVICE_ROLE_KEY
    }
  }

  private async getTableSchema(client: any, tableName: string): Promise<TableSchema | null> {
    try {
      // Récupérer les colonnes via une requête SQL directe
      const { data: columns, error: colError } = await client.rpc('sql', {
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            ordinal_position
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

      if (colError || !columns || columns.length === 0) {
        return null
      }

      const tableSchema: TableSchema = {
        columns: {},
        indexes: [],
        constraints: []
      }

      // Organiser les colonnes
      columns.forEach((col: any) => {
        tableSchema.columns[col.column_name] = {
          data_type: col.data_type,
          is_nullable: col.is_nullable,
          column_default: col.column_default,
          character_maximum_length: col.character_maximum_length,
          ordinal_position: col.ordinal_position
        }
      })

      return tableSchema

    } catch (error) {
      console.log(`⚠️ Erreur récupération schéma ${tableName}: ${error}`)
      return null
    }
  }

  private async getEnvironmentSchema(client: any, envName: string): Promise<SchemaInfo> {
    console.log(`📋 Analyse du schéma ${envName.toUpperCase()}...`)
    
    const tables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'lofts', 'profiles', 'teams',
      'team_members', 'tasks', 'transactions', 'transaction_category_references',
      'conversations', 'conversation_participants', 'messages', 'notifications', 'settings'
    ]

    const schemaInfo: SchemaInfo = {
      tables: {},
      environment: envName,
      timestamp: new Date().toISOString()
    }

    for (const tableName of tables) {
      const tableSchema = await this.getTableSchema(client, tableName)
      if (tableSchema) {
        schemaInfo.tables[tableName] = tableSchema
        console.log(`✅ ${tableName}: ${Object.keys(tableSchema.columns).length} colonnes`)
      } else {
        console.log(`⚠️ ${tableName}: Table non trouvée ou vide`)
      }
    }

    return schemaInfo
  }

  private compareSchemas(sourceSchema: SchemaInfo, targetSchema: SchemaInfo) {
    console.log('\n🔍 COMPARAISON DES SCHÉMAS')
    console.log('=' .repeat(50))

    const differences: any = {
      missingTables: [],
      missingColumns: [],
      differentColumns: [],
      summary: {
        totalTables: Object.keys(sourceSchema.tables).length,
        missingTablesCount: 0,
        missingColumnsCount: 0,
        differentColumnsCount: 0
      }
    }

    // Comparer les tables
    for (const tableName in sourceSchema.tables) {
      if (!targetSchema.tables[tableName]) {
        differences.missingTables.push(tableName)
        differences.summary.missingTablesCount++
        console.log(`❌ Table manquante dans ${this.targetEnv.toUpperCase()}: ${tableName}`)
        continue
      }

      const sourceTable = sourceSchema.tables[tableName]
      const targetTable = targetSchema.tables[tableName]

      // Comparer les colonnes
      for (const columnName in sourceTable.columns) {
        if (!targetTable.columns[columnName]) {
          differences.missingColumns.push(`${tableName}.${columnName}`)
          differences.summary.missingColumnsCount++
          console.log(`❌ Colonne manquante: ${tableName}.${columnName}`)
        } else {
          // Comparer les types de colonnes
          const sourceCol = sourceTable.columns[columnName]
          const targetCol = targetTable.columns[columnName]
          
          if (sourceCol.data_type !== targetCol.data_type) {
            differences.differentColumns.push({
              table: tableName,
              column: columnName,
              sourceType: sourceCol.data_type,
              targetType: targetCol.data_type
            })
            differences.summary.differentColumnsCount++
            console.log(`⚠️ Type différent: ${tableName}.${columnName} (${sourceCol.data_type} vs ${targetCol.data_type})`)
          }
        }
      }
    }

    return differences
  }

  private async generateSyncSQL(sourceSchema: SchemaInfo, targetSchema: SchemaInfo, differences: any): Promise<string> {
    console.log('\n🔧 GÉNÉRATION DU SCRIPT DE SYNCHRONISATION')
    console.log('=' .repeat(50))

    let syncSQL = `-- =====================================================
-- SCRIPT DE SYNCHRONISATION DES SCHÉMAS
-- Source: ${this.sourceEnv.toUpperCase()} → Cible: ${this.targetEnv.toUpperCase()}
-- Généré le: ${new Date().toLocaleString('fr-FR')}
-- =====================================================

BEGIN;

`

    // 1. Créer les tables manquantes
    for (const tableName of differences.missingTables) {
      console.log(`📝 Génération CREATE TABLE pour ${tableName}`)
      
      const sourceTable = sourceSchema.tables[tableName]
      const columns = Object.entries(sourceTable.columns)
        .sort(([,a], [,b]) => a.ordinal_position - b.ordinal_position)
        .map(([colName, colInfo]) => {
          let colDef = `  ${colName} ${colInfo.data_type}`
          
          if (colInfo.character_maximum_length) {
            colDef += `(${colInfo.character_maximum_length})`
          }
          
          if (colInfo.is_nullable === 'NO') {
            colDef += ' NOT NULL'
          }
          
          if (colInfo.column_default) {
            colDef += ` DEFAULT ${colInfo.column_default}`
          }
          
          return colDef
        })

      syncSQL += `-- Créer la table ${tableName}
CREATE TABLE IF NOT EXISTS ${tableName} (
${columns.join(',\n')}
);

`
    }

    // 2. Ajouter les colonnes manquantes
    for (const missingCol of differences.missingColumns) {
      const [tableName, columnName] = missingCol.split('.')
      const colInfo = sourceSchema.tables[tableName].columns[columnName]
      
      console.log(`📝 Génération ALTER TABLE pour ${missingCol}`)
      
      let colDef = `${colInfo.data_type}`
      if (colInfo.character_maximum_length) {
        colDef += `(${colInfo.character_maximum_length})`
      }
      
      syncSQL += `-- Ajouter la colonne ${missingCol}
ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${colDef}`
      
      if (colInfo.is_nullable === 'NO') {
        syncSQL += ' NOT NULL'
      }
      
      if (colInfo.column_default) {
        syncSQL += ` DEFAULT ${colInfo.column_default}`
      }
      
      syncSQL += ';\n\n'
    }

    // 3. Modifier les colonnes avec des types différents
    for (const diffCol of differences.differentColumns) {
      console.log(`📝 Génération ALTER COLUMN pour ${diffCol.table}.${diffCol.column}`)
      
      syncSQL += `-- Modifier le type de ${diffCol.table}.${diffCol.column}
-- ATTENTION: Vérifiez manuellement cette modification
-- ALTER TABLE ${diffCol.table} ALTER COLUMN ${diffCol.column} TYPE ${diffCol.sourceType};

`
    }

    syncSQL += `COMMIT;

-- =====================================================
-- RÉSUMÉ DE LA SYNCHRONISATION
-- =====================================================
-- Tables créées: ${differences.missingTables.length}
-- Colonnes ajoutées: ${differences.missingColumns.length}
-- Types modifiés: ${differences.differentColumns.length}
-- 
-- IMPORTANT: Testez ce script sur un environnement de test avant la production!
-- =====================================================
`

    return syncSQL
  }

  async synchronizeSchemas(): Promise<void> {
    console.log('🔄 SYNCHRONISATION DES SCHÉMAS')
    console.log('=' .repeat(60))
    
    await this.initializeClients()

    // Analyser les schémas
    const sourceSchema = await this.getEnvironmentSchema(this.sourceClient, this.sourceEnv)
    const targetSchema = await this.getEnvironmentSchema(this.targetClient, this.targetEnv)

    // Sauvegarder les schémas pour référence
    writeFileSync(`schema_${this.sourceEnv}_${Date.now()}.json`, JSON.stringify(sourceSchema, null, 2))
    writeFileSync(`schema_${this.targetEnv}_${Date.now()}.json`, JSON.stringify(targetSchema, null, 2))

    // Comparer
    const differences = this.compareSchemas(sourceSchema, targetSchema)

    // Générer le script de synchronisation
    const syncSQL = await this.generateSyncSQL(sourceSchema, targetSchema, differences)
    
    const sqlFileName = `sync_${this.sourceEnv}_to_${this.targetEnv}_${Date.now()}.sql`
    writeFileSync(sqlFileName, syncSQL)

    // Rapport final
    console.log('\n📊 RÉSUMÉ DE LA SYNCHRONISATION')
    console.log('=' .repeat(50))
    console.log(`📁 Script SQL généré: ${sqlFileName}`)
    console.log(`📋 Tables à créer: ${differences.summary.missingTablesCount}`)
    console.log(`📋 Colonnes à ajouter: ${differences.summary.missingColumnsCount}`)
    console.log(`📋 Types à modifier: ${differences.summary.differentColumnsCount}`)

    if (differences.summary.missingTablesCount === 0 && differences.summary.missingColumnsCount === 0) {
      console.log('🎉 SCHÉMAS DÉJÀ SYNCHRONISÉS!')
    } else {
      console.log('\n🎯 PROCHAINES ÉTAPES:')
      console.log(`1. Examinez le script: ${sqlFileName}`)
      console.log(`2. Testez sur un environnement de test`)
      console.log(`3. Exécutez le script sur ${this.targetEnv.toUpperCase()}`)
      console.log('4. Relancez la synchronisation pour vérifier')
    }
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('📋 Usage: npm run tsx scripts/sync-schemas.ts <source> <target>')
    console.log('')
    console.log('Environnements disponibles: prod, test, dev')
    console.log('')
    console.log('Exemples:')
    console.log('• npm run tsx scripts/sync-schemas.ts prod test')
    console.log('• npm run tsx scripts/sync-schemas.ts prod dev')
    console.log('• npm run tsx scripts/sync-schemas.ts test dev')
    return
  }

  const [source, target] = args
  
  if (!['prod', 'test', 'dev'].includes(source) || !['prod', 'test', 'dev'].includes(target)) {
    console.log('❌ Environnements non valides. Utilisez: prod, test, dev')
    return
  }

  if (source === target) {
    console.log('❌ La source et la cible ne peuvent pas être identiques')
    return
  }

  // Confirmation pour les opérations sensibles
  if (target === 'prod') {
    console.log('⚠️ ATTENTION: Vous allez modifier la PRODUCTION!')
    console.log('❌ Cette opération est interdite pour des raisons de sécurité.')
    return
  }

  const synchronizer = new SchemaSynchronizer(source, target)
  await synchronizer.synchronizeSchemas()
}

main().catch(console.error)