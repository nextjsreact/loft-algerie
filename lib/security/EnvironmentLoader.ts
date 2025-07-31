/**
 * EnvironmentLoader - Chargeur d'environnements isolé
 * Charge les configurations d'environnement sans conflit
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

export interface EnvironmentConfig {
  name: string
  type: 'production' | 'test' | 'development'
  url: string
  anonKey: string
  serviceKey: string
  isProtected: boolean
  client: any
}

export class EnvironmentLoader {
  /**
   * Charge un environnement de manière isolée
   */
  static async loadEnvironment(envName: string): Promise<EnvironmentConfig | null> {
    try {
      const configFile = this.getConfigFile(envName)
      const configPath = resolve(process.cwd(), configFile)
      
      // Lire le fichier directement sans affecter process.env
      const envContent = readFileSync(configPath, 'utf8')
      const envVars = this.parseEnvFile(envContent)
      
      const url = envVars.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY
      
      if (!url || !serviceKey) {
        console.log(`❌ Variables manquantes pour ${envName}:`)
        console.log(`   URL: ${!!url}`)
        console.log(`   SERVICE_KEY: ${!!serviceKey}`)
        return null
      }
      
      const environment: EnvironmentConfig = {
        name: envName,
        type: this.identifyEnvironmentType(envName),
        url: url,
        anonKey: anonKey || '',
        serviceKey: serviceKey,
        isProtected: this.isProtectedEnvironment(envName),
        client: createClient(url, serviceKey)
      }
      
      return environment
      
    } catch (error) {
      console.log(`❌ Erreur chargement ${envName}:`, error)
      return null
    }
  }
  
  /**
   * Parse un fichier .env en objet
   */
  private static parseEnvFile(content: string): Record<string, string> {
    const envVars: Record<string, string> = {}
    
    content.split('\n').forEach(line => {
      line = line.trim()
      
      // Ignorer les commentaires et lignes vides
      if (!line || line.startsWith('#')) return
      
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim()
        
        // Supprimer les guillemets si présents
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        
        envVars[key.trim()] = value
      }
    })
    
    return envVars
  }
  
  /**
   * Obtient le fichier de configuration pour un environnement
   */
  private static getConfigFile(envName: string): string {
    const envMap: Record<string, string> = {
      'prod': '.env.prod',
      'production': '.env.production',
      'test': '.env.test',
      'dev': '.env.development',
      'development': '.env.development'
    }
    
    return envMap[envName.toLowerCase()] || `.env.${envName}`
  }
  
  /**
   * Identifie le type d'environnement
   */
  private static identifyEnvironmentType(envName: string): 'production' | 'test' | 'development' {
    const name = envName.toLowerCase()
    
    if (name.includes('prod')) return 'production'
    if (name.includes('test')) return 'test'
    if (name.includes('dev')) return 'development'
    
    return 'development'
  }
  
  /**
   * Détermine si un environnement est protégé
   */
  private static isProtectedEnvironment(envName: string): boolean {
    return this.identifyEnvironmentType(envName) === 'production'
  }
  
  /**
   * Teste la connectivité d'un environnement
   */
  static async testConnectivity(env: EnvironmentConfig): Promise<boolean> {
    try {
      const { error } = await env.client
        .from('profiles')
        .select('id', { head: true })
        .limit(1)
      
      return !error
    } catch (error) {
      return false
    }
  }
  
  /**
   * Masque l'URL pour l'affichage sécurisé
   */
  static maskUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.hostname.substring(0, 8)}...`
    } catch {
      return url.substring(0, 20) + '...'
    }
  }
}