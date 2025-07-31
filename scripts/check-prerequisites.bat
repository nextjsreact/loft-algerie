@echo off
echo ========================================
echo VERIFICATION DES PREREQUIS
echo ========================================

echo.
echo Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Node.js installe: 
    node --version
) else (
    echo ❌ Node.js non trouve. Installez Node.js 18+ depuis https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Verification de npm...
npm --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ npm installe: 
    npm --version
) else (
    echo ❌ npm non trouve
    pause
    exit /b 1
)

echo.
echo Verification de Git...
git --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Git installe: 
    git --version
) else (
    echo ⚠️ Git non trouve (optionnel pour le developpement local)
)

echo.
echo ========================================
echo VERIFICATION TERMINEE
echo ========================================
echo.
echo Tous les prerequis sont installes!
echo Vous pouvez maintenant executer:
echo   npm run setup:guide
echo.
pause