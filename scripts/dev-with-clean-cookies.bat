@echo off
echo ========================================
echo DEMARRAGE AVEC NETTOYAGE AUTOMATIQUE
echo ========================================

echo.
echo 🧹 Nettoyage du cache Next.js...
rmdir /s /q .next 2>nul
echo ✅ Cache Next.js nettoye

echo.
echo 📝 Instructions pour nettoyer les cookies:
echo 1. Ouvrez scripts\clear-cookies.html dans votre navigateur
echo 2. Cliquez sur "Nettoyer tous les cookies"
echo 3. Ou utilisez la navigation privee (Ctrl+Shift+N)

echo.
echo 🚀 Demarrage du serveur de developpement...
npm run dev

pause