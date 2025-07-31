#!/usr/bin/env tsx
/**
 * SYSTÈME DE CLONAGE INTELLIGENT AVEC ADAPTATION AUTOMATIQUE
 * Clone les données entre environnements en s'adaptant aux différences de schéma
 * Usage: npm run tsx scripts/intelligent-clone.ts <source> <target>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

interface CloneResult {
  table: string
  status: 'success' | 'error' | 'empty' | 'skipped'
  sourceCount: number
  targetCount: number
  adaptations: string[]
  errors: string[]
}

interface CloneSummary {
  totalTables: number
  successfulTables: number
  totalRecords: number
  adaptations: number
  errors: string[]
  results: { [table: string]: CloneResult }
}

class IntelligentClone {
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

  private async getTableColumns(client: any, tableName: string): Promise<string[]> {
    try {
      // Essayer de récupérer un échantillon pour déterminer les colonnes
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        // Si erreur, essayer une requête vide pour vérifier l'existence
        const { error: emptyError } = await client
          .from(tableName)
          .select('*')
          .limit(0)
        
        if (emptyError) {
          return [] // Table n'existe pas
        }
        
        // Table existe mais est vide, retourner un tableau vide pour l'instant
        return []
      }

      return data && data.length > 0 ? Object.keys(data[0]) : []
    } catch (error) {
      return []
    }
  }

  private async tableExists(client: any, tableName: string): Promise<boolean> {
    try {
      const { error } = await client
        .from(tableName)
        .select('*')
        .limit(0)

      return !error
    } catch (error) {
      return false
    }
  }

  private adaptDataToSchema(sourceData: any[], sourceColumns: string[], targetColumns: string[]): { data: any[], adaptations: string[] } {
    const adaptations: string[] = []
    
    const adaptedData = sourceData.map(record => {
      const adaptedRecord: any = {}
      
      // Copier les colonnes communes
      for (const column of targetColumns) {
        if (sourceColumns.includes(column)) {
          adaptedRecord[column] = record[column]
        } else {
          // Colonne manquante dans la source, utiliser une valeur par défaut
          if (column === 'created_at' || column === 'updated_at') {
            adaptedRecord[column] = new Date().toISOString()
            if (!adaptations.includes(`Ajout automatique de ${column}`)) {
              adaptations.push(`Ajout automatique de ${column}`)
            }
          } else if (column.includes('_id') && column !== 'id') {
            // Laisser null pour les clés étrangères
            adaptedRecord[column] = null
            if (!adaptations.includes(`Clé étrangère ${column} mise à null`)) {
              adaptations.push(`Clé étrangère ${column} mise à null`)
            }
          }
          // Sinon, laisser undefined pour utiliser la valeur par défaut de la DB
        }
      }
      
      return adaptedRecord
    })

    // Signaler les colonnes supprimées
    const droppedColumns = sourceColumns.filter(col => !targetColumns.includes(col))
    if (droppedColumns.length > 0) {
      adaptations.push(`Colonnes ignorées: ${droppedColumns.join(', ')}`)
    }

    return { data: adaptedData, adaptations }
  }

  private async cloneTable(tableName: string): Promise<CloneResult> {
    const result: CloneResult = {
      table: tableName,
      status: 'error',
      sourceCount: 0,
      targetCount: 0,
      adaptations: [],
      errors: []
    }

    try {
      console.log(`📋 Clonage de ${tableName}...`)

      // 1. Récupérer les données source
      const { data: sourceData, error: sourceError } = await this.sourceEnv.client
        .from(tableName)
        .select('*')

      if (sourceError) {
        result.errors.push(`Erreur source: ${sourceError.message}`)
        return result
      }

      if (!sourceData || sourceData.length === 0) {
        result.status = 'empty'
        console.log(`   ℹ️ Table vide`)
        return result
      }

      result.sourceCount = sourceData.length
      console.log(`   📊 ${sourceData.length} enregistrements source`)

      // 2. Vérifier que la table cible existe
      const targetExists = await this.tableExists(this.targetEnv.client, tableName)
      if (!targetExists) {
        result.errors.push('Table cible non trouvée ou inaccessible')
        return result
      }

      // 3. Analyser les structures
      const sourceColumns = Object.keys(sourceData[0])
      const targetColumns = await this.getTableColumns(this.targetEnv.client, tableName)

      // Si la table cible est vide, utiliser les colonnes source comme référence
      const effectiveTargetColumns = targetColumns.length > 0 ? targetColumns : sourceColumns

      console.log(`   🔍 Source: ${sourceColumns.length} colonnes, Cible: ${effectiveTargetColumns.length} colonnes`)

      // 4. Adapter les données
      const { data: adaptedData, adaptations } = this.adaptDataToSchema(
        sourceData, 
        sourceColumns, 
        effectiveTargetColumns
      )

      result.adaptations = adaptations

      if (adaptations.length > 0) {
        console.log(`   🔧 Adaptations: ${adaptations.join(', ')}`)
      }

      // 5. Vider la table cible (sauf pour les tables système)
      if (!['profiles', 'auth'].some(sys => tableName.includes(sys))) {
        const { error: deleteError } = await this.targetEnv.client
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError && !deleteError.message.includes('No rows found')) {
          console.log(`   ⚠️ Nettoyage: ${deleteError.message}`)
        }
      }

      // 6. Insérer par lots pour éviter les timeouts
      const batchSize = 50
      let insertedCount = 0

      for (let i = 0; i < adaptedData.length; i += batchSize) {
        const batch = adaptedData.slice(i, i + batchSize)
        
        const { data: insertedData, error: insertError } = await this.targetEnv.client
          .from(tableName)
          .insert(batch)

        if (insertError) {
          // Essayer l'insertion individuelle pour identifier les problèmes
          console.log(`   ⚠️ Erreur lot ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
          
          for (const record of batch) {
            const { error: singleError } = await this.targetEnv.client
              .from(tableName)
              .insert([record])
            
            if (!singleError) {
              insertedCount++
            } else {
              result.errors.push(`Enregistrement: ${singleError.message}`)
            }
          }
        } else {
          insertedCount += batch.length
        }
      }

      result.targetCount = insertedCount
      result.status = insertedCount > 0 ? 'success' : 'error'

      console.log(`   ✅ ${insertedCount}/${sourceData.length} enregistrements insérés`)

    } catch (error) {
      result.errors.push(`Erreur générale: ${error}`)
      console.log(`   ❌ Erreur: ${error}`)
    }

    return result
  }

  async executeClone(): Promise<CloneSummary> {
    console.log('🧠 CLONAGE INTELLIGENT AVEC ADAPTATION AUTOMATIQUE')
    console.log('='.repeat(60))

    await this.initializeEnvironments()

    // Tables à cloner dans l'ordre de dépendance
    const tablesToClone = [
      'zone_areas',
      'internet_connection_types', 
      'loft_owners',
      'categories',
      'currencies',
      'payment_methods',
      'lofts',
      'teams',
      'team_members',
      'tasks',
      'transaction_category_references',
      'transactions',
      'settings'
    ]

    const summary: CloneSummary = {
      totalTables: tablesToClone.length,
      successfulTables: 0,
      totalRecords: 0,
      adaptations: 0,
      errors: [],
      results: {}
    }

    // Cloner chaque table
    for (const tableName of tablesToClone) {
      const result = await this.cloneTable(tableName)
      summary.results[tableName] = result

      if (result.status === 'success') {
        summary.successfulTables++
        summary.totalRecords += result.targetCount
      }

      summary.adaptations += result.adaptations.length
      summary.errors.push(...result.errors)
    }

    // Rapport final
    console.log('\n📊 RAPPORT FINAL DU CLONAGE INTELLIGENT')
    console.log('='.repeat(60))
    console.log(`📈 Tables traitées: ${summary.totalTables}`)
    console.log(`✅ Tables réussies: ${summary.successfulTables}`)
    console.log(`📊 Total enregistrements: ${summary.totalRecords}`)
    console.log(`🔧 Adaptations effectuées: ${summary.adaptations}`)
    console.log(`❌ Erreurs: ${summary.errors.length}`)

    // Détails par table
    console.log('\n📋 DÉTAILS PAR TABLE:')
    for (const [tableName, result] of Object.entries(summary.results)) {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'empty' ? 'ℹ️' : '❌'
      
      console.log(`${status} ${tableName}: ${result.sourceCount} → ${result.targetCount}`)
      
      if (result.adaptations.length > 0) {
        result.adaptations.forEach(adaptation => {
          console.log(`     🔧 ${adaptation}`)
        })
      }
      
      if (result.errors.length > 0) {
        result.errors.slice(0, 2).forEach(error => {
          console.log(`     ❌ ${error}`)
        })
        if (result.errors.length > 2) {
          console.log(`     ... et ${result.errors.length - 2} autres erreurs`)
        }
      }
    }

    // Sauvegarder le rapport
    const report = {
      timestamp: new Date().toISOString(),
      source: this.sourceName,
      target: this.targetName,
      summary: summary
    }

    const reportPath = `clone_report_${this.sourceName}_to_${this.targetName}_${Date.now()}.json`
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Rapport détaillé: ${reportPath}`)

    if (summary.successfulTables === summary.totalTables) {
      console.log('\n🎉 CLONAGE INTELLIGENT TERMINÉ AVEC SUCCÈS!')
    } else {
      console.log('\n⚠️ CLONAGE TERMINÉ AVEC DES AVERTISSEMENTS')
      console.log('📋 Consultez le rapport détaillé pour plus d\'informations')
    }

    return summary
  }
}

// Interface en ligne de commande
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length !== 2) {
    console.log('📋 Usage: npm run tsx scripts/intelligent-clone.ts <source> <target>')
    console.log('')
    console.log('Environnements disponibles: prod, test, dev')
    console.log('')
    console.log('Exemples:')
    console.log('• npm run tsx scripts/intelligent-clone.ts prod test')
    console.log('• npm run tsx scripts/intelligent-clone.ts prod dev')
    console.log('• npm run tsx scripts/intelligent-clone.ts test dev')
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

  const clone = new IntelligentClone(source, target)
  await clone.executeClone()
}

main().catch(console.error)