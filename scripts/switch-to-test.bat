@echo off
echo 🧪 Basculement vers l'environnement de TEST
echo ========================================

if not exist ".env.test" (
    echo ❌ Erreur: Le fichier .env.test n'existe pas!
    echo 💡 Configurez d'abord votre environnement de test avec: npm run setup:test-env
    pause
    exit /b 1
)

if exist ".env.local" (
    copy ".env.local" ".env.local.backup" >nul
    echo 💾 Environnement actuel sauvegardé
)

copy ".env.test" ".env.local" >nul
if %errorlevel% == 0 (
    echo ✅ Basculement réussi vers l'environnement de TEST
    echo 🌐 URL: https://test-loft-algerie.vercel.app
    echo 🗄️ Base de données: Test/Staging
    echo 🧪 Données: Données de test incluses
    echo.
    echo 🚀 Vous pouvez maintenant démarrer avec: npm run dev
    echo 🔍 Testez la connexion avec: npm run test-env
) else (
    echo ❌ Erreur lors du basculement
)

echo.
pause