#!/usr/bin/env node
/**
 * Guide pas à pas pour la mise en place des environnements multi-stages
 * Ce script vous accompagne dans toute la configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function executeCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  console.log(`Commande: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Terminé!');
    return true;
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return false;
  }
}

async function stepByStepGuide() {
  console.log('🎯 GUIDE PAS À PAS - ENVIRONNEMENTS MULTI-STAGES');
  console.log('=' .repeat(60));
  console.log('Ce guide vous accompagne dans la mise en place complète de vos environnements.\n');

  try {
    // Étape 1: Vérification des prérequis
    console.log('📋 ÉTAPE 1: Vérification des prérequis');
    console.log('-' .repeat(40));
    
    const hasNodejs = await question('Avez-vous Node.js 18+ installé? (o/n): ');
    if (hasNodejs.toLowerCase() !== 'o') {
      console.log('❌ Veuillez installer Node.js 18+ depuis https://nodejs.org');
      return;
    }

    const hasSupabase = await question('Avez-vous un compte Supabase? (o/n): ');
    if (hasSupabase.toLowerCase() !== 'o') {
      console.log('📝 Créez un compte sur https://supabase.com');
      await question('Appuyez sur Entrée quand c\'est fait...');
    }

    // Étape 2: Configuration du projet Supabase de développement
    console.log('\n🗄️ ÉTAPE 2: Configuration du projet Supabase de développement');
    console.log('-' .repeat(40));
    
    console.log('1. Allez sur https://supabase.com/dashboard');
    console.log('2. Cliquez sur "New project"');
    console.log('3. Nommez votre projet: "loft-algerie-dev"');
    console.log('4. Choisissez la région: "Europe West (Ireland)"');
    console.log('5. Créez le projet');
    
    await question('Appuyez sur Entrée quand votre projet est créé...');

    // Collecte des informations Supabase
    console.log('\n🔑 Récupération des clés Supabase:');
    console.log('Dans votre dashboard Supabase, allez dans Settings > API');
    
    const supabaseUrl = await question('URL du projet (Project URL): ');
    const anonKey = await question('Clé anonyme (anon/public): ');
    const serviceRoleKey = await question('Clé service_role: ');

    // Étape 3: Configuration de l'environnement local
    console.log('\n⚙️ ÉTAPE 3: Configuration de l\'environnement local');
    console.log('-' .repeat(40));

    const authSecret = require('crypto').randomBytes(32).toString('hex');
    
    const envContent = `# ===========================================
# ENVIRONNEMENT DE DÉVELOPPEMENT LOCAL
# ===========================================
# Généré le ${new Date().toLocaleString()}

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
    console.log('✅ Fichier .env.local créé!');

    // Étape 4: Application du schéma de base de données
    console.log('\n📊 ÉTAPE 4: Application du schéma de base de données');
    console.log('-' .repeat(40));
    
    if (fs.existsSync('schema.sql')) {
      console.log('Schéma détecté. Application en cours...');
      console.log('\n📝 Instructions pour appliquer le schéma:');
      console.log('1. Ouvrez votre dashboard Supabase');
      console.log('2. Allez dans "SQL Editor"');
      console.log('3. Cliquez sur "New query"');
      console.log('4. Copiez tout le contenu du fichier schema.sql');
      console.log('5. Collez-le dans l\'éditeur et cliquez sur "Run"');
      
      await question('Appuyez sur Entrée quand le schéma est appliqué...');
    }

    // Étape 5: Installation des dépendances
    console.log('\n📦 ÉTAPE 5: Installation des dépendances');
    console.log('-' .repeat(40));
    
    const installDeps = await question('Installer les dépendances maintenant? (o/n): ');
    if (installDeps.toLowerCase() === 'o') {
      executeCommand('npm install', 'Installation des dépendances');
    }

    // Étape 6: Test de l'environnement
    console.log('\n🧪 ÉTAPE 6: Test de l\'environnement');
    console.log('-' .repeat(40));
    
    const testEnv = await question('Tester la connexion à la base de données? (o/n): ');
    if (testEnv.toLowerCase() === 'o') {
      executeCommand('npm run test-env', 'Test de la connexion');
    }

    // Étape 7: Démarrage du serveur de développement
    console.log('\n🚀 ÉTAPE 7: Démarrage du serveur de développement');
    console.log('-' .repeat(40));
    
    const startDev = await question('Démarrer le serveur de développement? (o/n): ');
    if (startDev.toLowerCase() === 'o') {
      console.log('\n🌟 Démarrage du serveur...');
      console.log('Votre application sera disponible sur: http://localhost:3000');
      console.log('Appuyez sur Ctrl+C pour arrêter le serveur');
      executeCommand('npm run dev', 'Démarrage du serveur de développement');
    }

    // Récapitulatif
    console.log('\n🎉 CONFIGURATION TERMINÉE!');
    console.log('=' .repeat(60));
    console.log('✅ Environnement de développement configuré');
    console.log('✅ Base de données Supabase connectée');
    console.log('✅ Variables d\'environnement configurées');
    
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Testez votre application sur http://localhost:3000');
    console.log('2. Configurez les environnements de test et production');
    console.log('3. Mettez en place le CI/CD avec GitHub Actions');
    
    console.log('\n🔧 COMMANDES UTILES:');
    console.log('• npm run dev          - Démarrer le développement');
    console.log('• npm run test-env     - Tester la connexion DB');
    console.log('• npm run health:check - Vérifier la santé de l\'app');
    console.log('• npm run build        - Builder l\'application');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
  } finally {
    rl.close();
  }
}

stepByStepGuide();