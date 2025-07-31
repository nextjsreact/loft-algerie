#!/usr/bin/env node
/**
 * Script d'aide pour configurer votre premier environnement de développement
 * Ce script vous guide pas à pas dans la configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🚀 Configuration de votre environnement de développement');
  console.log('=' .repeat(60));
  
  console.log('\n📋 Nous allons configurer votre projet Supabase pour le développement.');
  console.log('Si vous n\'avez pas encore de projet Supabase, créez-en un sur https://supabase.com\n');

  try {
    // Collecter les informations Supabase
    const supabaseUrl = await question('🔗 URL de votre projet Supabase (ex: https://abc123.supabase.co): ');
    const anonKey = await question('🔑 Clé anonyme Supabase: ');
    const serviceRoleKey = await question('🔐 Clé service role Supabase: ');
    
    // Générer un secret d'authentification
    const authSecret = require('crypto').randomBytes(32).toString('hex');
    console.log(`🔒 Secret d'authentification généré: ${authSecret}`);

    // Créer le fichier .env.local
    const envContent = `# ===========================================
# ENVIRONNEMENT DE DÉVELOPPEMENT LOCAL
# ===========================================
# Généré automatiquement le ${new Date().toLocaleString()}

# Base de données Supabase - Développement
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY="${serviceRoleKey}"

# Authentication
AUTH_SECRET=${authSecret}

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Logging et Debug
NEXT_PUBLIC_DEBUG_MODE=true
LOG_LEVEL=debug

# Notifications temps réel
NEXT_PUBLIC_REALTIME_ENABLED=true

# Base de données locale
NEXT_PUBLIC_HAS_DB=true
`;

    fs.writeFileSync('.env.local', envContent);
    console.log('\n✅ Fichier .env.local créé avec succès!');

    // Vérifier si le schéma de base de données existe
    if (fs.existsSync('schema.sql')) {
      console.log('\n📊 Schéma de base de données détecté.');
      const applySchema = await question('Voulez-vous appliquer le schéma à votre base de données Supabase? (o/n): ');
      
      if (applySchema.toLowerCase() === 'o' || applySchema.toLowerCase() === 'oui') {
        console.log('📝 Pour appliquer le schéma:');
        console.log('1. Allez sur votre dashboard Supabase');
        console.log('2. Ouvrez l\'éditeur SQL');
        console.log('3. Copiez le contenu du fichier schema.sql');
        console.log('4. Exécutez le script');
      }
    }

    console.log('\n🎉 Configuration terminée!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Vérifiez votre configuration: npm run test-env');
    console.log('2. Démarrez le serveur de développement: npm run dev');
    console.log('3. Ouvrez http://localhost:3000 dans votre navigateur');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
  } finally {
    rl.close();
  }
}

setupEnvironment();