# Script avancé pour créer une "application" Loft Algérie

# Créer le dossier de l'application
$appDir = "$env:LOCALAPPDATA\LoftAlgerie"
if (!(Test-Path $appDir)) {
    New-Item -ItemType Directory -Path $appDir -Force
}

# Copier l'icône
$iconSource = ".\public\icon-512x512.png"
$iconDest = "$appDir\icon.png"
if (Test-Path $iconSource) {
    Copy-Item $iconSource $iconDest -Force
    Write-Host "✅ Icône copiée" -ForegroundColor Green
}

# Créer un script de lancement
$launchScript = @"
@echo off
title Loft Algérie
echo Lancement de Loft Algérie...
start "" "https://loft-algerie-fcm5v3f76-habib-fr2001-9481s-projects.vercel.app"
"@

$launchScript | Out-File -FilePath "$appDir\launch.bat" -Encoding ASCII

# Créer le raccourci sur le Bureau
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Loft Algérie.lnk")
$Shortcut.TargetPath = "$appDir\launch.bat"
$Shortcut.Description = "Loft Algérie - Gestion des lofts"
$Shortcut.WorkingDirectory = $appDir
$Shortcut.WindowStyle = 7  # Minimized
if (Test-Path $iconDest) {
    $Shortcut.IconLocation = $iconDest
}
$Shortcut.Save()

# Créer aussi un raccourci dans le menu Démarrer
$startMenuDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
$StartMenuShortcut = $WshShell.CreateShortcut("$startMenuDir\Loft Algérie.lnk")
$StartMenuShortcut.TargetPath = "$appDir\launch.bat"
$StartMenuShortcut.Description = "Loft Algérie - Gestion des lofts"
$StartMenuShortcut.WorkingDirectory = $appDir
$StartMenuShortcut.WindowStyle = 7
if (Test-Path $iconDest) {
    $StartMenuShortcut.IconLocation = $iconDest
}
$StartMenuShortcut.Save()

Write-Host ""
Write-Host "🎉 Application Loft Algérie installée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Raccourcis créés :" -ForegroundColor Yellow
Write-Host "   • Bureau: Loft Algérie.lnk" -ForegroundColor White
Write-Host "   • Menu Démarrer: Loft Algérie.lnk" -ForegroundColor White
Write-Host ""
Write-Host "📂 Fichiers installés dans: $appDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Double-cliquez sur l'icône pour lancer l'application !" -ForegroundColor Green