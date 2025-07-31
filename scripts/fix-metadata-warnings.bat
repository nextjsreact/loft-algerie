@echo off
echo ========================================
echo CORRECTION DES WARNINGS METADATA
echo ========================================

echo.
echo Nettoyage du cache Next.js...
rmdir /s /q .next 2>nul
echo ✅ Cache Next.js supprime

echo.
echo Nettoyage des modules node...
rmdir /s /q node_modules\.cache 2>nul
echo ✅ Cache modules nettoye

echo.
echo Reinstallation des dependances...
npm install
echo ✅ Dependances reinstallees

echo.
echo Redemarrage du serveur de developpement...
echo Les warnings metadata devraient maintenant etre corriges!
echo.
echo Executez maintenant: npm run dev
echo.
pause