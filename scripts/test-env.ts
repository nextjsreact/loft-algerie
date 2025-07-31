#!/usr/bin/env tsx
/**
 * Script de test d'environnement amélioré
 * Vérifie la configuration et teste la connexion à Supabase
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Charger les variables d'environnement
const envPath = resolve(process.cwd(), '.env.local')
console.log('🔍 Test de l\'environnement de développement')
console.log('=' .repeat(50))

console.log(`📁 Chargement des variables depuis: ${envPath}`)
const result = config({ path: envPath })

if (result.error) {
  console.log('⚠️ Fichier .env.local non trouvé, tentative avec .env')
  config({ path: resolve(process.cwd(), '.env') })
}

console.log('\n📋 Vérification des variables d\'environnement:')
console.log('-' .repeat(30))

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'AUTH_SECRET'
]

let allVarsPresent = true

requiredVars.forEach(varName => {
  const isSet = !!process.env[varName]
  console.log(`${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'Définie' : 'MANQUANTE'}`)
  if (!isSet) allVarsPresent = false
})

if (!allVarsPresent) {
  console.log('\n❌ Variables d\'environnement manquantes!')
  console.log('💡 Exécutez: npm run setup:first')
  process.exit(1)
}

// Test de connexion à Supabase
console.log('\n🔗 Test de connexion à Supabase:')
console.log('-' .repeat(30))

async function testSupabaseConnection() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    console.log(`📡 Connexion à: ${supabaseUrl}`)
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test simple de connexion
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('⚠️ Table "profiles" non trouvée')
        console.log('💡 Appliquez le schéma de base de données depuis schema.sql')
        return false
      } else {
        console.log(`❌ Erreur de connexion: ${error.message}`)
        return false
      }
    }
    
    console.log('✅ Connexion à Supabase réussie!')
    console.log('✅ Base de données accessible!')
    return true
    
  } catch (error) {
    console.log(`❌ Erreur: ${error}`)
    return false
  }
}

// Test avec service role
async function testServiceRole() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (!error) {
      console.log('✅ Service Role Key fonctionnelle!')
      return true
    } else {
      console.log(`⚠️ Service Role Key: ${error.message}`)
      return false
    }
    
  } catch (error) {
    console.log(`❌ Erreur Service Role: ${error}`)
    return false
  }
}

async function runTests() {
  const connectionOk = await testSupabaseConnection()
  const serviceRoleOk = await testServiceRole()
  
  console.log('\n📊 Résumé des tests:')
  console.log('=' .repeat(30))
  console.log(`Variables d'environnement: ${allVarsPresent ? '✅' : '❌'}`)
  console.log(`Connexion Supabase: ${connectionOk ? '✅' : '❌'}`)
  console.log(`Service Role: ${serviceRoleOk ? '✅' : '❌'}`)
  
  if (allVarsPresent && connectionOk && serviceRoleOk) {
    console.log('\n🎉 Environnement configuré correctement!')
    console.log('🚀 Vous pouvez démarrer le développement avec: npm run dev')
  } else {
    console.log('\n❌ Configuration incomplète')
    console.log('💡 Consultez le guide: QUICK_START.md')
  }
  
  console.log('\n🔧 Informations système:')
  console.log(`Node.js: ${process.version}`)
  console.log(`Répertoire: ${process.cwd()}`)
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`)
}

runTests().catch(console.error)