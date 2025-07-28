# Script pour créer un raccourci Loft Algérie avec icône
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Loft Algérie.lnk")
$Shortcut.TargetPath = "https://loft-algerie-fcm5v3f76-habib-fr2001-9481s-projects.vercel.app"
$Shortcut.Description = "Application Loft Algérie - Gestion des lofts"
$Shortcut.WorkingDirectory = $env:USERPROFILE
# Utilise l'icône par défaut du navigateur
$Shortcut.IconLocation = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe,0"
$Shortcut.Save()

Write-Host "Raccourci créé sur le Bureau !" -ForegroundColor Green
Write-Host "Nom: Loft Algérie.lnk" -ForegroundColor Yellow