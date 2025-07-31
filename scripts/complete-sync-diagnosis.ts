#!/usr/bin/env tsx
/**
 * DIAGNOSTIC COMPLET DE SYNCHRONISATION
 * Analyse tous les environnements et identifie les problèmes de synchronisation
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
  status: 'connected' | 'error'
  error?: string
}

interface TableAnalysis {
  name: string
  environments: {
    [env: string]: {
      exists: boolean
      columns: string[]
      recordCount: number
      structure: any[]
    }
  }
  issues: string[]
  recommendations: string[]
}

interface DiagnosisReport {
  timestamp: string
  environments: { [name: string]: Environment }
  tables: TableAnalysis[]
  globalIssues: string[]
  recommendations: string[]
  summary: {
    totalEnvironments: number
    connectedEnvironments: number
    totalTables: number
    tablesWithIssues: number
    totalIssues: number
  }
}

class CompleteSyncDiagnosis {
  private environments: Map<string, Environment> = new Map()
  private expectedTables = [
    'profiles', 'user_sessions', 'zone_areas', 'internet_connection_types',
    'loft_owners', 'lofts', 'categories', 'currencies', 'payment_methods',
    'teams', 'team_members', 'tasks', 'transactions', 'notifications',
    'transaction_category_references', 'settings', 'conversations',
    'conversation_participants', 'messages'
  ]

  constructor() {
    this.loadAllEnvironments()
  }

  private loadAllEnvironments() {
    const envConfigs = [
      { name: 'prod', file: '.env.production' },
      { name: 'test', file: '.env.test' },
      { name: 'dev', file: '.env.development' }
    ]

    console.log('🔍 CHARGEMENT DES ENVIRONNEMENTS')
    console.log('='.repeat(50))

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
            // Vérifier que les valeurs ne sont pas des placeholders
            const hasPlaceholders = envVars.NEXT_PUBLIC_SUPABASE_URL.includes('[') || 
                                   envVars.SUPABASE_SERVICE_ROLE_KEY.includes('[')
            
            if (hasPlaceholders) {
              const env: Environment = {
                name: config.name,
                url: envVars.NEXT_PUBLIC_SUPABASE_URL,
                key: envVars.SUPABASE_SERVICE_ROLE_KEY,
                client: null,
                status: 'error',
                error: 'Configuration contient des placeholders - veuillez configurer les vraies valeurs'
              }
              this.environments.set(config.name, env)
              console.log(`❌ ${config.name.toUpperCase()}: Configuration incomplète`)
            } else {
              const env: Environment = {
                name: config.name,
                url: envVars.NEXT_PUBLIC_SUPABASE_URL,
                key: envVars.SUPABASE_SERVICE_ROLE_KEY,
                client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY),
                status: 'connected'
              }
              this.environments.set(config.name, env)
              console.log(`✅ ${config.name.toUpperCase()}: Connecté`)
            }
          } else {
            console.log(`❌ ${config.name.toUpperCase()}: Variables manquantes`)
          }
        } else {
          console.log(`⚠️ ${config.name.toUpperCase()}: Fichier ${config.file} non trouvé`)
        }
      } catch (error) {
        const env: Environment = {
          name: config.name,
          url: '',
          key: '',
          client: null,
          status: 'error',
          error: String(error)
        }
        this.environments.set(config.name, env)
        console.log(`❌ ${config.name.toUpperCase()}: Erreur de chargement`)
      }
    }
  }

  private async testEnvironmentConnection(env: Environment): Promise<void> {
    if (env.status === 'error') return

    try {
      const { data, error } = await env.client
        .from('profiles')
        .select('id')
        .limit(1)

      if (error && !error.message.includes('relation "profiles" does not exist')) {
        env.status = 'error'
        env.error = error.message
      }
    } catch (error) {
      env.status = 'error'
      env.error = String(error)
    }
  }

  private async analyzeTable(tableName: string): Promise<TableAnalysis> {
    const analysis: TableAnalysis = {
      name: tableName,
      environments: {},
      issues: [],
      recommendations: []
    }

    console.log(`📋 Analyse de ${tableName}...`)

    for (const [envName, env] of this.environments) {
      if (env.status === 'error') {
        analysis.environments[envName] = {
          exists: false,
          columns: [],
          recordCount: 0,
          structure: []
        }
        continue
      }

      try {
        // Tester l'existence et compter les enregistrements
        const { data, error, count } = await env.client
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          analysis.environments[envName] = {
            exists: false,
            columns: [],
            recordCount: 0,
            structure: []
          }
          continue
        }

        // Récupérer la structure en récupérant un échantillon de données
        let structure: any[] = []
        let columns: string[] = []
        
        if (count && count > 0) {
          const { data: sampleData } = await env.client
            .from(tableName)
            .select('*')
            .limit(1)
          
          if (sampleData && sampleData.length > 0) {
            columns = Object.keys(sampleData[0])
            structure = columns.map((col, index) => ({
              column_name: col,
              data_type: typeof sampleData[0][col],
              ordinal_position: index + 1
            }))
          }
        } else {
          // Si pas de données, essayer de récupérer la structure via une requête vide
          const { data: emptyData, error: emptyError } = await env.client
            .from(tableName)
            .select('*')
            .limit(0)
          
          if (!emptyError) {
            // Utiliser les métadonnées de la réponse si disponibles
            columns = []
            structure = []
          }
        }

        analysis.environments[envName] = {
          exists: true,
          columns: columns,
          recordCount: count || 0,
          structure: structure
        }

        console.log(`   ${envName.toUpperCase()}: ${columns.length} colonnes, ${count || 0} enregistrements`)

      } catch (error) {
        analysis.environments[envName] = {
          exists: false,
          columns: [],
          recordCount: 0,
          structure: []
        }
        console.log(`   ${envName.toUpperCase()}: Erreur - ${error}`)
      }
    }

    // Analyser les différences
    this.analyzeTableDifferences(analysis)

    return analysis
  }

  private analyzeTableDifferences(analysis: TableAnalysis) {
    const envNames = Array.from(this.environments.keys()).filter(
      name => this.environments.get(name)?.status === 'connected'
    )

    if (envNames.length < 2) return

    // Vérifier l'existence dans tous les environnements
    const existsIn = envNames.filter(env => analysis.environments[env]?.exists)
    const missingIn = envNames.filter(env => !analysis.environments[env]?.exists)

    if (missingIn.length > 0) {
      analysis.issues.push(`Table manquante dans: ${missingIn.join(', ')}`)
      analysis.recommendations.push(`Créer la table ${analysis.name} dans: ${missingIn.join(', ')}`)
    }

    if (existsIn.length < 2) return

    // Comparer les colonnes entre environnements existants
    const referenceEnv = existsIn[0]
    const referenceColumns = analysis.environments[referenceEnv].columns

    for (const envName of existsIn.slice(1)) {
      const envColumns = analysis.environments[envName].columns
      
      // Colonnes manquantes
      const missingColumns = referenceColumns.filter(col => !envColumns.includes(col))
      if (missingColumns.length > 0) {
        analysis.issues.push(`Colonnes manquantes dans ${envName}: ${missingColumns.join(', ')}`)
        analysis.recommendations.push(`Ajouter colonnes dans ${envName}: ${missingColumns.join(', ')}`)
      }

      // Colonnes supplémentaires
      const extraColumns = envColumns.filter(col => !referenceColumns.includes(col))
      if (extraColumns.length > 0) {
        analysis.issues.push(`Colonnes supplémentaires dans ${envName}: ${extraColumns.join(', ')}`)
      }
    }

    // Vérifier les types de données
    if (existsIn.length >= 2) {
      this.compareColumnTypes(analysis, existsIn)
    }
  }

  private compareColumnTypes(analysis: TableAnalysis, envNames: string[]) {
    const referenceEnv = envNames[0]
    const referenceStructure = analysis.environments[referenceEnv].structure

    for (const envName of envNames.slice(1)) {
      const envStructure = analysis.environments[envName].structure
      
      for (const refCol of referenceStructure) {
        const envCol = envStructure.find((col: any) => col.column_name === refCol.column_name)
        
        if (envCol && refCol.data_type !== envCol.data_type) {
          analysis.issues.push(
            `Type différent pour ${refCol.column_name}: ${referenceEnv}(${refCol.data_type}) vs ${envName}(${envCol.data_type})`
          )
          analysis.recommendations.push(
            `Harmoniser le type de ${refCol.column_name} entre ${referenceEnv} et ${envName}`
          )
        }
      }
    }
  }

  async runCompleteDiagnosis(): Promise<DiagnosisReport> {
    console.log('🔍 DIAGNOSTIC COMPLET DE SYNCHRONISATION')
    console.log('='.repeat(60))

    // Tester les connexions
    console.log('\n📡 TEST DES CONNEXIONS')
    console.log('-'.repeat(30))
    
    for (const [name, env] of this.environments) {
      await this.testEnvironmentConnection(env)
      const status = env.status === 'connected' ? '✅' : '❌'
      console.log(`${status} ${name.toUpperCase()}: ${env.status}`)
      if (env.error) {
        console.log(`   Erreur: ${env.error}`)
      }
    }

    // Analyser chaque table
    console.log('\n📋 ANALYSE DES TABLES')
    console.log('-'.repeat(30))

    const tableAnalyses: TableAnalysis[] = []
    
    for (const tableName of this.expectedTables) {
      const analysis = await this.analyzeTable(tableName)
      tableAnalyses.push(analysis)
    }

    // Générer le rapport
    const connectedEnvs = Array.from(this.environments.values()).filter(env => env.status === 'connected')
    const tablesWithIssues = tableAnalyses.filter(table => table.issues.length > 0)
    const totalIssues = tableAnalyses.reduce((sum, table) => sum + table.issues.length, 0)

    const report: DiagnosisReport = {
      timestamp: new Date().toISOString(),
      environments: Object.fromEntries(this.environments),
      tables: tableAnalyses,
      globalIssues: [],
      recommendations: [],
      summary: {
        totalEnvironments: this.environments.size,
        connectedEnvironments: connectedEnvs.length,
        totalTables: this.expectedTables.length,
        tablesWithIssues: tablesWithIssues.length,
        totalIssues: totalIssues
      }
    }

    // Analyser les problèmes globaux
    this.analyzeGlobalIssues(report)

    // Afficher le résumé
    this.displaySummary(report)

    // Sauvegarder le rapport (en excluant les clients pour éviter les références circulaires)
    const reportPath = `complete_sync_diagnosis_${Date.now()}.json`
    const cleanReport = {
      ...report,
      environments: Object.fromEntries(
        Object.entries(report.environments).map(([key, env]) => [
          key,
          {
            name: env.name,
            url: env.url,
            status: env.status,
            error: env.error
          }
        ])
      )
    }
    writeFileSync(reportPath, JSON.stringify(cleanReport, null, 2))
    console.log(`\n📄 Rapport complet sauvegardé: ${reportPath}`)

    return report
  }

  private analyzeGlobalIssues(report: DiagnosisReport) {
    const connectedEnvs = Object.values(report.environments).filter(env => env.status === 'connected')
    
    if (connectedEnvs.length < 2) {
      report.globalIssues.push('Moins de 2 environnements connectés - impossible de synchroniser')
      report.recommendations.push('Vérifier la configuration des environnements')
    }

    // Vérifier si certaines tables sont complètement manquantes
    const completelyMissingTables = report.tables.filter(table => 
      Object.values(table.environments).every(env => !env.exists)
    )

    if (completelyMissingTables.length > 0) {
      report.globalIssues.push(`Tables complètement manquantes: ${completelyMissingTables.map(t => t.name).join(', ')}`)
      report.recommendations.push('Exécuter le schéma principal sur tous les environnements')
    }

    // Recommandations générales
    if (report.summary.tablesWithIssues > 0) {
      report.recommendations.push('Utiliser le script universal-schema-sync.ts pour synchroniser les schémas')
      report.recommendations.push('Utiliser le script intelligent-clone.ts pour cloner les données')
    }
  }

  private displaySummary(report: DiagnosisReport) {
    console.log('\n📊 RÉSUMÉ DU DIAGNOSTIC')
    console.log('='.repeat(50))
    console.log(`🌐 Environnements: ${report.summary.connectedEnvironments}/${report.summary.totalEnvironments} connectés`)
    console.log(`📋 Tables: ${report.summary.totalTables} analysées`)
    console.log(`⚠️ Tables avec problèmes: ${report.summary.tablesWithIssues}`)
    console.log(`❌ Total des problèmes: ${report.summary.totalIssues}`)

    if (report.summary.totalIssues === 0) {
      console.log('\n🎉 TOUS LES ENVIRONNEMENTS SONT SYNCHRONISÉS!')
      console.log('✅ Aucun problème de schéma détecté')
      console.log('🚀 Vous pouvez utiliser les scripts de clonage sans problème')
    } else {
      console.log('\n⚠️ PROBLÈMES DÉTECTÉS:')
      
      // Top 5 des tables avec le plus de problèmes
      const topProblematicTables = report.tables
        .filter(table => table.issues.length > 0)
        .sort((a, b) => b.issues.length - a.issues.length)
        .slice(0, 5)

      topProblematicTables.forEach(table => {
        console.log(`   📋 ${table.name}: ${table.issues.length} problème(s)`)
        table.issues.slice(0, 2).forEach(issue => {
          console.log(`      • ${issue}`)
        })
        if (table.issues.length > 2) {
          console.log(`      ... et ${table.issues.length - 2} autres`)
        }
      })

      console.log('\n🎯 RECOMMANDATIONS PRIORITAIRES:')
      const uniqueRecommendations = [...new Set(report.recommendations)]
      uniqueRecommendations.slice(0, 5).forEach(rec => {
        console.log(`   • ${rec}`)
      })

      console.log('\n🔧 PROCHAINES ÉTAPES:')
      console.log('1. npm run tsx scripts/universal-schema-sync.ts prod test')
      console.log('2. npm run tsx scripts/universal-schema-sync.ts prod dev')
      console.log('3. npm run tsx scripts/intelligent-clone.ts prod test')
      console.log('4. npm run tsx scripts/intelligent-clone.ts prod dev')
      console.log('5. Relancer ce diagnostic pour vérifier')
    }
  }
}

// Interface en ligne de commande
async function main() {
  const diagnosis = new CompleteSyncDiagnosis()
  await diagnosis.runCompleteDiagnosis()
}

main().catch(console.error)