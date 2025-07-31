@echo off
echo 🚀 Basculement vers l'environnement de PRODUCTION
echo ========================================

if not exist ".env.production" (
    echo ❌ Erreur: Le fichier .env.production n'existe pas!
    echo 💡 Configurez d'abord votre environnement de production
    pause
    exit /b 1
)

echo ⚠️ ATTENTION: Vous basculez vers l'environnement de PRODUCTION
echo ⚠️ Cela utilisera la base de données de production réelle
echo.
set /p confirm="Êtes-vous sûr? (tapez OUI pour confirmer): "

if not "%confirm%"=="OUI" (
    echo ❌ Basculement annulé
    pause
    exit /b 0
)

if exist ".env.local" (
    copy ".env.local" ".env.local.backup" >nul
    echo 💾 Environnement actuel sauvegardé
)

copy ".env.production" ".env.local" >nul
if %errorlevel% == 0 (
    echo ✅ Basculement réussi vers l'environnement de PRODUCTION
    echo 🌐 URL: https://loft-algerie.com
    echo 🗄️ Base de données: Production (RÉELLE)
    echo ⚠️ ATTENTION: Vous travaillez maintenant avec des données réelles!
    echo.
    echo 🚀 Vous pouvez maintenant démarrer avec: npm run dev
    echo 🔍 Testez la connexion avec: npm run test-env
) else (
    echo ❌ Erreur lors du basculement
)

echo.
pause