#!/usr/bin/env node
/**
 * Script de configuration de l'environnement de test
 * Ce script vous guide dans la création de l'environnement de test
 */

const fs = require('fs');
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

async function setupTestEnvironment() {
  console.log('🧪 CONFIGURATION DE L\'ENVIRONNEMENT DE TEST');
  console.log('=' .repeat(60));
  console.log('Ce script vous aide à créer un environnement de test séparé.\n');

  try {
    // Étape 1: Vérification des prérequis
    console.log('📋 ÉTAPE 1: Vérification de l\'environnement de développement');
    console.log('-' .repeat(50));
    
    if (!fs.existsSync('.env.local')) {
      console.log('❌ Environnement de développement non configuré');
      console.log('💡 Configurez d\'abord votre environnement de développement avec: npm run setup:guide');
      return;
    }
    
    console.log('✅ Environnement de développement détecté');

    // Étape 2: Création du projet Supabase de test
    console.log('\n🗄️ ÉTAPE 2: Configuration du projet Supabase de test');
    console.log('-' .repeat(50));
    
    console.log('📝 Instructions pour créer le projet Supabase de test:');
    console.log('1. Allez sur https://supabase.com/dashboard');
    console.log('2. Cliquez sur "New project"');
    console.log('3. Nommez votre projet: "loft-algerie-test"');
    console.log('4. Choisissez la région: "Europe West (Ireland)"');
    console.log('5. Créez le projet');
    console.log('6. Attendez que le projet soit complètement initialisé');
    
    await question('Appuyez sur Entrée quand votre projet de test est créé...');

    // Étape 3: Collecte des informations Supabase de test
    console.log('\n🔑 ÉTAPE 3: Configuration des clés Supabase de test');
    console.log('-' .repeat(50));
    console.log('Dans votre dashboard Supabase du projet TEST, allez dans Settings > API');
    
    const testSupabaseUrl = await question('URL du projet TEST (Project URL): ');
    const testAnonKey = await question('Clé anonyme TEST (anon/public): ');
    const testServiceRoleKey = await question('Clé service_role TEST: ');

    // Étape 4: Génération du fichier .env.test
    console.log('\n⚙️ ÉTAPE 4: Génération du fichier .env.test');
    console.log('-' .repeat(50));

    const testAuthSecret = require('crypto').randomBytes(32).toString('hex');
    
    const testEnvContent = `# ===========================================
# ENVIRONNEMENT DE TEST/STAGING
# ===========================================
# Généré automatiquement le ${new Date().toLocaleString()}

# Base de données Supabase - Test
NEXT_PUBLIC_SUPABASE_URL=${testSupabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${testAnonKey}
SUPABASE_SERVICE_ROLE_KEY="${testServiceRoleKey}"

# Authentication
AUTH_SECRET=${testAuthSecret}

# Application
NEXT_PUBLIC_APP_URL=https://test-loft-algerie.vercel.app
NODE_ENV=test

# Logging et Debug
NEXT_PUBLIC_DEBUG_MODE=false
LOG_LEVEL=info

# Email (service de test - Mailtrap recommandé)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=[VOTRE_MAILTRAP_USER]
SMTP_PASS=[VOTRE_MAILTRAP_PASS]
SMTP_FROM=test@loft-algerie.com

# Monitoring et Analytics (limités)
NEXT_PUBLIC_ANALYTICS_ENABLED=true
SENTRY_DSN=[VOTRE_TEST_SENTRY_DSN]

# Cache et Performance
REDIS_URL=[VOTRE_TEST_REDIS_URL]
ENABLE_CACHE=true

# Tests automatisés
ENABLE_E2E_TESTS=true
PLAYWRIGHT_BASE_URL=https://test-loft-algerie.vercel.app

# Notifications temps réel
NEXT_PUBLIC_REALTIME_ENABLED=true

# Base de données
NEXT_PUBLIC_HAS_DB=true
`;

    fs.writeFileSync('.env.test', testEnvContent);
    console.log('✅ Fichier .env.test créé!');

    // Étape 5: Application du schéma de base de données
    console.log('\n📊 ÉTAPE 5: Application du schéma de base de données de test');
    console.log('-' .repeat(50));
    
    console.log('📝 Instructions pour appliquer le schéma:');
    console.log('1. Ouvrez votre dashboard Supabase du projet TEST');
    console.log('2. Allez dans "SQL Editor"');
    console.log('3. Cliquez sur "New query"');
    console.log('4. Copiez tout le contenu du fichier scripts/schema-supabase-safe.sql');
    console.log('5. Collez-le dans l\'éditeur et cliquez sur "Run"');
    console.log('6. Vérifiez qu\'il n\'y a pas d\'erreurs');
    
    await question('Appuyez sur Entrée quand le schéma de test est appliqué...');

    // Étape 6: Configuration des données de test
    console.log('\n🌱 ÉTAPE 6: Insertion des données de test');
    console.log('-' .repeat(50));
    
    const addTestData = await question('Voulez-vous ajouter des données de test? (o/n): ');
    if (addTestData.toLowerCase() === 'o') {
      console.log('📝 Instructions pour les données de test:');
      console.log('1. Dans votre éditeur SQL Supabase du projet TEST');
      console.log('2. Copiez et exécutez le contenu du fichier scripts/seed-test-data.sql');
      console.log('3. Cela créera des lofts, propriétaires et données d\'exemple');
      
      await question('Appuyez sur Entrée quand les données de test sont ajoutées...');
    }

    // Étape 7: Test de l'environnement
    console.log('\n🧪 ÉTAPE 7: Test de l\'environnement de test');
    console.log('-' .repeat(50));
    
    const testEnv = await question('Tester la connexion à la base de données de test? (o/n): ');
    if (testEnv.toLowerCase() === 'o') {
      console.log('🔄 Basculement vers l\'environnement de test...');
      
      // Sauvegarder l'environnement actuel
      if (fs.existsSync('.env.local')) {
        fs.copyFileSync('.env.local', '.env.local.backup');
        console.log('💾 Environnement de développement sauvegardé');
      }
      
      // Basculer vers test
      fs.copyFileSync('.env.test', '.env.local');
      console.log('🔄 Basculé vers l\'environnement de test');
      
      // Tester
      const testResult = executeCommand('npm run test-env', 'Test de la connexion de test');
      
      if (testResult) {
        console.log('✅ Environnement de test fonctionnel!');
      } else {
        console.log('❌ Problème avec l\'environnement de test');
      }
      
      // Restaurer l'environnement de développement
      if (fs.existsSync('.env.local.backup')) {
        fs.copyFileSync('.env.local.backup', '.env.local');
        fs.unlinkSync('.env.local.backup');
        console.log('🔄 Environnement de développement restauré');
      }
    }

    // Étape 8: Configuration du déploiement
    console.log('\n🚀 ÉTAPE 8: Configuration du déploiement automatique');
    console.log('-' .repeat(50));
    
    const setupDeploy = await question('Configurer le déploiement automatique sur Vercel? (o/n): ');
    if (setupDeploy.toLowerCase() === 'o') {
      console.log('📝 Instructions pour Vercel:');
      console.log('1. Allez sur https://vercel.com/dashboard');
      console.log('2. Importez votre projet GitHub');
      console.log('3. Configurez les variables d\'environnement depuis .env.test');
      console.log('4. Configurez le déploiement automatique sur la branche "staging"');
      console.log('5. Votre URL de test sera: https://test-loft-algerie.vercel.app');
    }

    // Récapitulatif
    console.log('\n🎉 CONFIGURATION DE L\'ENVIRONNEMENT DE TEST TERMINÉE!');
    console.log('=' .repeat(60));
    console.log('✅ Projet Supabase de test créé');
    console.log('✅ Fichier .env.test configuré');
    console.log('✅ Schéma de base de données appliqué');
    console.log('✅ Variables d\'environnement configurées');
    
    console.log('\n📋 COMMANDES UTILES:');
    console.log('• npm run env:switch:test  - Basculer vers l\'environnement de test');
    console.log('• npm run env:switch:dev   - Retourner au développement');
    console.log('• npm run test-env         - Tester la connexion');
    console.log('• npm run deploy:test      - Déployer en test');
    
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('1. Testez localement avec: npm run env:switch:test && npm run dev');
    console.log('2. Configurez le déploiement sur Vercel');
    console.log('3. Mettez en place les tests automatisés');
    console.log('4. Configurez l\'environnement de production quand vous serez prêt');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
  } finally {
    rl.close();
  }
}

setupTestEnvironment();