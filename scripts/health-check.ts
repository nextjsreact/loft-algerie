#!/usr/bin/env tsx
/**
 * Script de vérification de santé de l'application
 * Vérifie la connectivité de la base de données et des services essentiels
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function healthCheck() {
  console.log('🏥 Vérification de santé de l\'application...')
  
  const results = {
    database: false,
    auth: false,
    realtime: false,
    overall: false
  }

  try {
    // Test de connexion à la base de données
    console.log('🗄️ Test de connexion à la base de données...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (!error) {
      results.database = true
      console.log('✅ Base de données: OK')
    } else {
      console.log('❌ Base de données: ERREUR', error.message)
    }

    // Test d'authentification
    console.log('🔐 Test du système d\'authentification...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (!authError) {
      results.auth = true
      console.log('✅ Authentification: OK')
    } else {
      console.log('❌ Authentification: ERREUR', authError.message)
    }

    // Test du temps réel
    console.log('⚡ Test des notifications temps réel...')
    const channel = supabase.channel('health-check')
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        results.realtime = true
        console.log('✅ Temps réel: OK')
      } else {
        console.log('❌ Temps réel: ERREUR')
      }
      channel.unsubscribe()
    })

    // Résultat global
    results.overall = results.database && results.auth && results.realtime
    
    console.log('\n📊 Résumé de la vérification:')
    console.log(`Base de données: ${results.database ? '✅' : '❌'}`)
    console.log(`Authentification: ${results.auth ? '✅' : '❌'}`)
    console.log(`Temps réel: ${results.realtime ? '✅' : '❌'}`)
    console.log(`État global: ${results.overall ? '✅ SAIN' : '❌ PROBLÈME DÉTECTÉ'}`)

    // Code de sortie
    process.exit(results.overall ? 0 : 1)

  } catch (error) {
    console.error('💥 Erreur lors de la vérification:', error)
    process.exit(1)
  }
}

// Exécuter la vérification
healthCheck()