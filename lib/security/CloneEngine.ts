/**
 * CloneEngine - Moteur de clonage intelligent avec adaptation de schéma
 * Gère les différences de schéma et adapte automatiquement les données
 */

import type { Environment } from './EnvironmentValidator'

export interface CloneOptions {
  dryRun?: boolean
  batchSize?: number
  excludeTables?: string[]
  includeTables?: string[]
  adaptSchema?: boolean
}

export interface CloneResult {
  success: boolean
  totalRecords: number
  tablesProcessed: number
  results: Record<string, TableResult>
  errors: string[]
  warnings: string[]
}

export interface TableResult {
  status: 'success' | 'error' | 'empty' | 'skipped'
  sourceRecords: number
  targetRecords: number
  adaptations: string[]
  error?: string
}

export interface SchemaInfo {
  tableName: string
  columns: string[]
  sampleData?: any
}

export class CloneEngine {
  private defaultTables = [
    'zone_areas', 'internet_connection_types', 'loft_owners', 'lofts',
    'categories', 'currencies', 'payment_methods', 'teams', 'team_members',
    'tasks', 'transaction_category_references', 'settings'
  ]

  /**
   * Exécute un clonage intelligent avec adaptation de schéma
   */
  async executeClone(
    source: Environment, 
    target: Environment, 
    options: CloneOptions = {}
  ): Promise<CloneResult> {
    const {
      dryRun = false,
      batchSize = 50,
      excludeTables = [],
      includeTables = this.defaultTables,
      adaptSchema = true
    } = options

    console.log(`\n🧠 MOTEUR DE CLONAGE INTELLIGENT`)
    console.log(`📋 Mode: ${dryRun ? 'SIMULATION' : 'EXÉCUTION'}`)
    console.log(`🔧 Adaptation de schéma: ${adaptSchema ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`)

    const result: CloneResult = {
      success: false,
      totalRecords: 0,
      tablesProcessed: 0,
      results: {},
      errors: [],
      warnings: []
    }

    // Filtrer les tables à traiter
    const tablesToProcess = includeTables.filter(table => !excludeTables.includes(table))
    console.log(`📊 Tables à traiter: ${tablesToProcess.length}`)

    for (const tableName of tablesToProcess) {
      console.log(`\n📋 Traitement intelligent: ${tableName}`)
      console.log('-'.repeat(40))

      try {
        const tableResult = await this.cloneTable(
          source, target, tableName, { dryRun, batchSize, adaptSchema }
        )

        result.results[tableName] = tableResult
        result.totalRecords += tableResult.targetRecords
        result.tablesProcessed++

        if (tableResult.status === 'error') {
          result.errors.push(`${tableName}: ${tableResult.error}`)
        }

        // Afficher les adaptations effectuées
        if (tableResult.adaptations.length > 0) {
          console.log(`🔧 Adaptations effectuées:`)
          tableResult.adaptations.forEach(adaptation => {
            console.log(`   • ${adaptation}`)
          })
        }

      } catch (error) {
        const errorMsg = `Erreur critique sur ${tableName}: ${error}`
        result.errors.push(errorMsg)
        result.results[tableName] = {
          status: 'error',
          sourceRecords: 0,
          targetRecords: 0,
          adaptations: [],
          error: String(error)
        }
        console.log(`💥 ${errorMsg}`)
      }
    }

    result.success = result.errors.length === 0
    return result
  }

  /**
   * Clone une table avec adaptation intelligente
   */
  private async cloneTable(
    source: Environment,
    target: Environment,
    tableName: string,
    options: { dryRun: boolean, batchSize: number, adaptSchema: boolean }
  ): Promise<TableResult> {
    const tableResult: TableResult = {
      status: 'success',
      sourceRecords: 0,
      targetRecords: 0,
      adaptations: []
    }

    try {
      // 1. Récupérer les données source
      console.log(`📤 Lecture des données source...`)
      const { data: sourceData, error: sourceError } = await source.client
        .from(tableName)
        .select('*')

      if (sourceError) {
        tableResult.status = 'error'
        tableResult.error = `Erreur source: ${sourceError.message}`
        return tableResult
      }

      if (!sourceData || sourceData.length === 0) {
        console.log(`ℹ️ Table vide`)
        tableResult.status = 'empty'
        return tableResult
      }

      tableResult.sourceRecords = sourceData.length
      console.log(`📊 ${sourceData.length} enregistrements source`)

      // 2. Analyser le schéma cible
      console.log(`🔍 Analyse du schéma cible...`)
      const targetSchema = await this.analyzeTargetSchema(target, tableName)
      
      if (!targetSchema) {
        tableResult.status = 'error'
        tableResult.error = 'Impossible d\'analyser le schéma cible'
        return tableResult
      }

      console.log(`🎯 ${targetSchema.columns.length} colonnes cible détectées`)

      // 3. Adapter les données si nécessaire
      let adaptedData = sourceData
      if (options.adaptSchema) {
        console.log(`🔧 Adaptation des données au schéma cible...`)
        const adaptationResult = this.adaptDataToSchema(sourceData, targetSchema)
        adaptedData = adaptationResult.data
        tableResult.adaptations = adaptationResult.adaptations
      }

      if (options.dryRun) {
        console.log(`🧪 [SIMULATION] Aurait cloné ${adaptedData.length} enregistrements`)
        tableResult.targetRecords = adaptedData.length
        return tableResult
      }

      // 4. Vider la table cible
      console.log(`🗑️ Vidage de la table cible...`)
      const { error: deleteError } = await target.client
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError && !deleteError.message.includes('No rows found')) {
        tableResult.adaptations.push(`Avertissement vidage: ${deleteError.message}`)
      }

      // 5. Insérer les données adaptées par lots
      console.log(`📥 Insertion par lots (taille: ${options.batchSize})...`)
      let insertedCount = 0

      for (let i = 0; i < adaptedData.length; i += options.batchSize) {
        const batch = adaptedData.slice(i, i + options.batchSize)
        const batchNum = Math.floor(i / options.batchSize) + 1

        const { error: insertError } = await target.client
          .from(tableName)
          .insert(batch)

        if (insertError) {
          console.log(`❌ Erreur lot ${batchNum}: ${insertError.message}`)
          
          // Tentative d'insertion individuelle pour ce lot
          console.log(`🔄 Tentative d'insertion individuelle...`)
          for (const record of batch) {
            try {
              const { error: singleError } = await target.client
                .from(tableName)
                .insert([record])
              
              if (!singleError) {
                insertedCount++
              } else {
                // Essayer avec encore plus d'adaptation
                const ultraAdapted = this.ultraAdaptRecord(record, targetSchema)
                const { error: ultraError } = await target.client
                  .from(tableName)
                  .insert([ultraAdapted])
                
                if (!ultraError) {
                  insertedCount++
                  tableResult.adaptations.push('Adaptation ultra appliquée')
                }
              }
            } catch (e) {
              // Ignorer les erreurs individuelles
            }
          }
        } else {
          insertedCount += batch.length
          console.log(`✅ Lot ${batchNum}: ${batch.length} enregistrements`)
        }
      }

      tableResult.targetRecords = insertedCount
      console.log(`✅ ${insertedCount}/${sourceData.length} enregistrements clonés`)

      if (insertedCount < sourceData.length) {
        tableResult.adaptations.push(`${sourceData.length - insertedCount} enregistrements non clonés`)
      }

      return tableResult

    } catch (error) {
      tableResult.status = 'error'
      tableResult.error = String(error)
      return tableResult
    }
  }

  /**
   * Analyse le schéma d'une table cible
   */
  private async analyzeTargetSchema(target: Environment, tableName: string): Promise<SchemaInfo | null> {
    try {
      // Essayer de récupérer un échantillon pour déterminer la structure
      const { data: sampleData, error } = await target.client
        .from(tableName)
        .select('*')
        .limit(1)

      if (!error && sampleData && sampleData.length > 0) {
        return {
          tableName,
          columns: Object.keys(sampleData[0]),
          sampleData: sampleData[0]
        }
      }

      // Si la table est vide, utiliser des colonnes connues par table
      const knownColumns = this.getKnownColumns(tableName)
      if (knownColumns.length > 0) {
        return {
          tableName,
          columns: knownColumns
        }
      }

      return null
    } catch (error) {
      console.log(`⚠️ Erreur analyse schéma ${tableName}:`, error)
      return null
    }
  }

  /**
   * Adapte les données au schéma cible
   */
  private adaptDataToSchema(sourceData: any[], targetSchema: SchemaInfo): {
    data: any[],
    adaptations: string[]
  } {
    const adaptations: string[] = []
    const targetColumns = targetSchema.columns

    const adaptedData = sourceData.map(record => {
      const adaptedRecord: any = {}

      // Copier seulement les colonnes qui existent dans la cible
      for (const column of targetColumns) {
        if (record.hasOwnProperty(column)) {
          adaptedRecord[column] = record[column]
        } else {
          // Ajouter des valeurs par défaut pour les colonnes manquantes
          if (column === 'created_at' || column === 'updated_at') {
            adaptedRecord[column] = new Date().toISOString()
          }
          // Laisser undefined pour les autres colonnes
        }
      }

      return adaptedRecord
    })

    // Identifier les colonnes supprimées
    const sourceColumns = sourceData.length > 0 ? Object.keys(sourceData[0]) : []
    const removedColumns = sourceColumns.filter(col => !targetColumns.includes(col))
    
    if (removedColumns.length > 0) {
      adaptations.push(`Colonnes supprimées: ${removedColumns.join(', ')}`)
    }

    // Identifier les colonnes ajoutées avec valeurs par défaut
    const addedColumns = targetColumns.filter(col => 
      sourceColumns.length > 0 && !sourceColumns.includes(col)
    )
    
    if (addedColumns.length > 0) {
      adaptations.push(`Colonnes ajoutées avec défauts: ${addedColumns.join(', ')}`)
    }

    return { data: adaptedData, adaptations }
  }

  /**
   * Adaptation ultra pour les enregistrements problématiques
   */
  private ultraAdaptRecord(record: any, targetSchema: SchemaInfo): any {
    const ultraAdapted: any = {}

    // Ne garder que les colonnes essentielles
    const essentialColumns = ['id', 'name', 'type', 'status']
    
    for (const column of targetSchema.columns) {
      if (record.hasOwnProperty(column)) {
        ultraAdapted[column] = record[column]
      } else if (essentialColumns.includes(column)) {
        // Valeurs par défaut pour les colonnes essentielles
        switch (column) {
          case 'name':
            ultraAdapted[column] = record.name || record.title || 'Imported'
            break
          case 'type':
            ultraAdapted[column] = record.type || 'default'
            break
          case 'status':
            ultraAdapted[column] = record.status || 'active'
            break
        }
      }
    }

    return ultraAdapted
  }

  /**
   * Retourne les colonnes connues pour une table
   */
  private getKnownColumns(tableName: string): string[] {
    const knownSchemas: Record<string, string[]> = {
      'zone_areas': ['id', 'name', 'created_at', 'updated_at'],
      'internet_connection_types': ['id', 'type', 'speed', 'provider', 'status', 'cost', 'created_at'],
      'loft_owners': ['id', 'name', 'email', 'phone', 'address', 'ownership_type', 'created_at', 'updated_at'],
      'lofts': [
        'id', 'name', 'address', 'price_per_month', 'status', 'owner_id', 
        'zone_area_id', 'internet_connection_type_id', 'description',
        'company_percentage', 'owner_percentage',
        'frequence_paiement_eau', 'prochaine_echeance_eau',
        'frequence_paiement_energie', 'prochaine_echeance_energie',
        'frequence_paiement_telephone', 'prochaine_echeance_telephone',
        'frequence_paiement_internet', 'prochaine_echeance_internet',
        'frequence_paiement_tv', 'prochaine_echeance_tv',
        'created_at', 'updated_at'
      ],
      'categories': ['id', 'name', 'description', 'type', 'created_at', 'updated_at'],
      'currencies': ['id', 'code', 'name', 'symbol', 'decimal_digits', 'is_default', 'created_at', 'updated_at', 'ratio'],
      'payment_methods': ['id', 'name', 'type', 'details', 'created_at', 'updated_at'],
      'teams': ['id', 'name', 'description', 'created_by', 'created_at', 'updated_at'],
      'team_members': ['id', 'team_id', 'user_id', 'role', 'joined_at'],
      'tasks': ['id', 'title', 'description', 'status', 'priority', 'assigned_to', 'team_id', 'loft_id', 'due_date', 'created_by', 'created_at', 'updated_at', 'completed_at'],
      'transaction_category_references': ['id', 'category', 'transaction_type', 'reference_amount', 'currency_id', 'description', 'is_active', 'created_at', 'updated_at'],
      'settings': ['key', 'value']
    }

    return knownSchemas[tableName] || []
  }
}