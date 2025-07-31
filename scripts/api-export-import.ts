#!/usr/bin/env tsx
/**
 * EXPORT/IMPORT VIA API SUPABASE
 * Alternative complète au pg_dump pour cloner les données
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'

interface Environment {
  name: string
  url: string
  key: string
  client: any
}

interface TableData {
  name: string
  data: any[]
  count: number
}

class APIExportImport {
  private environments: Map<string, Environment> = new Map()

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
            const hasPlaceholders = envVars.NEXT_PUBLIC_SUPABASE_URL.includes('[') || 
                                   envVars.SUPABASE_SERVICE_ROLE_KEY.includes('[')
            
            if (!hasPlaceholders) {
              const env: Environment = {
                name: config.name,
                url: envVars.NEXT_PUBLIC_SUPABASE_URL,
                key: envVars.SUPABASE_SERVICE_ROLE_KEY,
                client: createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY)
              }
              this.environments.set(config.name, env)
            }
          }
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }
  }

  private async exportTableData(client: any, tableName: string): Promise<TableData> {
    try {
      console.log(`   📋 Export de ${tableName}...`)
      
      const { data, error, count } = await client
        .from(tableName)
        .select('*', { count: 'exact' })

      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`)
        return { name: tableName, data: [], count: 0 }
      }

      console.log(`   ✅ ${count || 0} enregistrements exportés`)
      return { name: tableName, data: data || [], count: count || 0 }

    } catch (error) {
      console.log(`   ❌ Erreur: ${error}`)
      return { name: tableName, data: [], c