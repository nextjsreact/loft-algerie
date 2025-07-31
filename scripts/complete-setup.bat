@echo off
title Configuration Complete - Loft Algerie Multi-Environnements

echo.
echo ========================================
echo   CONFIGURATION COMPLETE DU PROJET
echo   Loft Algerie Multi-Environnements
echo ========================================
echo.

echo Etape 1/5: Verification des prerequis...
call scripts\check-prerequisites.bat
if %errorlevel% neq 0 (
    echo Erreur lors de la verification des prerequis
    pause
    exit /b 1
)

echo.
echo Etape 2/5: Installation des dependances...
npm install
if %errorlevel% neq 0 (
    echo Erreur lors de l'installation des dependances
    pause
    exit /b 1
)

echo.
echo Etape 3/5: Configuration de l'environnement...
echo Lancement du guide interactif...
npm run setup:guide

echo.
echo Etape 4/5: Test de l'environnement...
npm run test-env
if %errorlevel% neq 0 (
    echo Erreur lors du test de l'environnement
    echo Consultez le guide QUICK_START.md
    pause
    exit /b 1
)

echo.
echo Etape 5/5: Verification de sante...
npm run health:check

echo.
echo ========================================
echo   CONFIGURATION TERMINEE !
echo ========================================
echo.
echo ✅ Environnement de developpement configure
echo ✅ Base de donnees connectee
echo ✅ Application prete
echo.
echo 🚀 Pour demarrer le serveur de developpement:
echo    npm run dev
echo.
echo 📚 Documentation disponible:
echo    - QUICK_START.md
echo    - README_ENVIRONMENTS.md
echo    - DEPLOYMENT_GUIDE.md
echo.
pause