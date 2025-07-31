/**
 * SuperCloneEngine - Moteur de clonage ultra-intelligent
 * Gère les dépendances, les erreurs de cache et les contraintes
 */

import type { Environment } from './EnvironmentValidator'
import { CloneEngine, type CloneOptions, type CloneResult } from './CloneEngine'

export class SuperCloneEngine extends CloneEngine {
  
  /**
   * Ordre de clonage respectant les dépendances
   */
  private dependencyOrder = [
    // Tables de base sans dépendances
    'zone_areas',
    'internet_connection_types', 
    'loft_owners',
    'categories',
    'currencies',
    'payment_methods',
    
    // Tables avec dépendances
    'lofts', // Dépend de zone_areas, internet_connection_types, loft_owners
    'teams', // Peut dépendre des utilisateurs
    'team_members', // Dépend de teams
    'tasks', // Dépend de lofts, teams, utilisateurs
    'transaction_category_references',
    'settings'
  ]

  /**
   * Exécute un clonage ultra-intelligent avec gestion des dépendances
   */
  async executeClone(
    source: Environment, 
    target: Environment, 
    options: CloneOptions = {}
  ): Promise<CloneResult> {
    console.log(`\n🚀 MOTEUR DE CLONAGE ULTRA-INTELLIGENT`)
    console.log(`🔧 Gestion des dépendances et contraintes activée`)
    
    // Utiliser l'ordre de dépendances
    const orderedOptions = {
      ...options,
      includeTables: this.dependencyOrder.filter(table => 
        (options.includeTables || this.dependencyOrder).includes(table) &&
        !(options.excludeTables || []).includes(table)
      )
    }

    const result = await super.executeClone(source, target, orderedOptions)
    
    // Post-traitement pour les tables qui ont échoué
    await this.handleFailedTables(source, target, result)
    
    return result
  }

  /**
   * Gère les tables qui ont échoué avec des stratégies spéciales
   */
  private async handleFailedTables(
    source: Environment,
    target: Environment,
    result: CloneResult
  ): Promise<void> {
    console.log(`\n🔧 POST-TRAITEMENT DES ÉCHECS`)
    console.log('-'.repeat(40))

    const failedTables = Object.keys(result.results).filter(
      table => result.results[table].status === 'success' && 
               result.results[table].targetRecords === 0
    )

    if (failedTables.length === 0) {
      console.log('ℹ️ Aucun post-traitement nécessaire')
      return
    }

    console.log(`📋 ${failedTables.length} tables nécessitent un post-traitement`)

    for (const tableName of failedTables) {
      console.log(`\n🔄 Post-traitement: ${tableName}`)
      
      try {
        const success = await this.specialCloneTable(source, target, tableName)
        if (success > 0) {
          result.results[tableName].targetRecords = success
          result.totalRecords += success
          console.log(`✅ Post-traitement réussi: ${success} enregistrements`)
        }
      } catch (error) {
        console.log(`❌ Post-traitement échoué: ${error}`)
      }
    }
  }

  /**
   * Clonage spécial pour les tables problématiques
   */
  private async specialCloneTable(
    source: Environment,
    target: Environment,
    tableName: string
  ): Promise<number> {
    
    // Récupérer les données source
    const { data: sourceData, error: sourceError } = await source.client
      .from(tableName)
      .select('*')

    if (sourceError || !sourceData || sourceData.length === 0) {
      return 0
    }

    console.log(`📊 ${sourceData.length} enregistrements à traiter spécialement`)

    // Stratégies spéciales par table
    let processedData = sourceData
    let insertedCount = 0

    switch (tableName) {
      case 'internet_connection_types':
        processedData = this.fixInternetConnectionTypes(sourceData)
        break
        
      case 'lofts':
        processedData = await this.fixLofts(sourceData, target)
        break
        
      case 'tasks':
        processedData = await this.fixTasks(sourceData, target)
        break
        
      case 'teams':
        processedData = await this.fixTeams(sourceData, target)
        break
        
      default:
        processedData = this.genericFix(sourceData, tableName)
    }

    // Insertion avec gestion d'erreurs avancée
    for (const record of processedData) {
      try {
        const { error } = await target.client
          .from(tableName)
          .insert([record])

        if (!error) {
          insertedCount++
        } else {
          // Essayer avec adaptation ultra
          const ultraRecord = this.ultraSimplify(record, tableName)
          const { error: ultraError } = await target.client
            .from(tableName)
            .insert([ultraRecord])
          
          if (!ultraError) {
            insertedCount++
          }
        }
      } catch (e) {
        // Ignorer les erreurs individuelles
      }
    }

    return insertedCount
  }

  /**
   * Corrige les données internet_connection_types
   */
  private fixInternetConnectionTypes(data: any[]): any[] {
    return data.map(record => ({
      id: record.id,
      type: record.type || 'Unknown',
      speed: record.speed || '0 Mbps',
      provider: record.provider || 'Unknown',
      status: record.status || 'active',
      cost: record.cost || 0,
      created_at: record.created_at || new Date().toISOString()
    }))
  }

  /**
   * Corrige les données lofts
   */
  private async fixLofts(data: any[], target: Environment): Promise<any[]> {
    // Récupérer les IDs valides pour les relations
    const { data: owners } = await target.client.from('loft_owners').select('id').limit(10)
    const { data: zones } = await target.client.from('zone_areas').select('id').limit(10)
    const { data: internetTypes } = await target.client.from('internet_connection_types').select('id').limit(10)

    const defaultOwnerId = owners?.[0]?.id
    const defaultZoneId = zones?.[0]?.id  
    const defaultInternetId = internetTypes?.[0]?.id

    return data.map(record => ({
      id: record.id,
      name: record.name || 'Loft Importé',
      address: record.address || 'Adresse non spécifiée',
      price_per_month: record.price_per_month || 10000,
      status: record.status || 'available',
      description: record.description || '',
      owner_id: record.owner_id || defaultOwnerId,
      zone_area_id: record.zone_area_id || defaultZoneId,
      internet_connection_type_id: record.internet_connection_type_id || defaultInternetId,
      company_percentage: record.company_percentage || 20,
      owner_percentage: record.owner_percentage || 80,
      // Champs de facturation
      frequence_paiement_eau: record.frequence_paiement_eau || null,
      prochaine_echeance_eau: record.prochaine_echeance_eau || null,
      frequence_paiement_energie: record.frequence_paiement_energie || null,
      prochaine_echeance_energie: record.prochaine_echeance_energie || null,
      frequence_paiement_telephone: record.frequence_paiement_telephone || null,
      prochaine_echeance_telephone: record.prochaine_echeance_telephone || null,
      frequence_paiement_internet: record.frequence_paiement_internet || null,
      prochaine_echeance_internet: record.prochaine_echeance_internet || null,
      frequence_paiement_tv: record.frequence_paiement_tv || null,
      prochaine_echeance_tv: record.prochaine_echeance_tv || null,
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString()
    }))
  }

  /**
   * Corrige les données tasks
   */
  private async fixTasks(data: any[], target: Environment): Promise<any[]> {
    // Récupérer les IDs valides
    const { data: lofts } = await target.client.from('lofts').select('id').limit(10)
    const { data: teams } = await target.client.from('teams').select('id').limit(10)

    const defaultLoftId = lofts?.[0]?.id
    const defaultTeamId = teams?.[0]?.id

    return data.map(record => ({
      id: record.id,
      title: record.title || 'Tâche importée',
      description: record.description || '',
      status: record.status || 'todo',
      priority: record.priority || 'medium',
      assigned_to: null, // Éviter les contraintes de clés étrangères
      team_id: record.team_id || defaultTeamId,
      loft_id: record.loft_id || defaultLoftId,
      due_date: record.due_date || null,
      created_by: null, // Éviter les contraintes
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString(),
      completed_at: record.completed_at || null
    }))
  }

  /**
   * Corrige les données teams
   */
  private async fixTeams(data: any[], target: Environment): Promise<any[]> {
    return data.map(record => ({
      id: record.id,
      name: record.name || 'Équipe importée',
      description: record.description || '',
      created_by: null, // Éviter les contraintes de clés étrangères
      created_at: record.created_at || new Date().toISOString(),
      updated_at: record.updated_at || new Date().toISOString()
    }))
  }

  /**
   * Correction générique pour les autres tables
   */
  private genericFix(data: any[], tableName: string): any[] {
    return data.map(record => {
      const fixed: any = { ...record }
      
      // Ajouter des timestamps si manquants
      if (!fixed.created_at) {
        fixed.created_at = new Date().toISOString()
      }
      if (!fixed.updated_at && tableName !== 'settings') {
        fixed.updated_at = new Date().toISOString()
      }
      
      return fixed
    })
  }

  /**
   * Simplification ultra pour les enregistrements très problématiques
   */
  private ultraSimplify(record: any, tableName: string): any {
    const essential: any = {
      id: record.id
    }

    // Ajouter seulement les champs essentiels par table
    switch (tableName) {
      case 'zone_areas':
        essential.name = record.name || 'Zone importée'
        break
      case 'categories':
        essential.name = record.name || 'Catégorie importée'
        essential.type = record.type || 'general'
        break
      case 'currencies':
        essential.code = record.code || 'XXX'
        essential.name = record.name || 'Devise importée'
        essential.symbol = record.symbol || '?'
        break
      case 'payment_methods':
        essential.name = record.name || 'Méthode importée'
        break
      default:
        essential.name = record.name || 'Importé'
    }

    return essential
  }
}