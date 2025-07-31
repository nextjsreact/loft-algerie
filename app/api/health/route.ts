import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API de vérification de santé de l'application
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Vérification des variables d'environnement
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Variables d\'environnement manquantes',
        missing_vars: missingVars,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Test de connexion à Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    const responseTime = Date.now() - startTime

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Erreur de connexion à la base de données',
        error: error.message,
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Application fonctionnelle',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      response_time_ms: responseTime,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0'
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      status: 'error',
      message: 'Erreur interne du serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      response_time_ms: responseTime,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}