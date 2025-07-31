@echo off
echo 🔄 Basculement vers l'environnement de DÉVELOPPEMENT
echo ========================================

if not exist ".env.development" (
    echo ❌ Erreur: Le fichier .env.development n'existe pas!
    echo 💡 Configurez d'abord votre environnement de développement
    pause
    exit /b 1
)

if exist ".env.local" (
    copy ".env.local" ".env.local.backup" >nul
    echo 💾 Environnement actuel sauvegardé
)

copy ".env.development" ".env.local" >nul
if %errorlevel% == 0 (
    echo ✅ Basculement réussi vers l'environnement de DÉVELOPPEMENT
    echo 🌐 URL: http://localhost:3000
    echo 🗄️ Base de données: Développement
    echo.
    echo 🚀 Vous pouvez maintenant démarrer avec: npm run dev
) else (
    echo ❌ Erreur lors du basculement
)

echo.
pause