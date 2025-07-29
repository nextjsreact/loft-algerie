# Script pour créer un package d'icônes Loft Algérie pour les utilisateurs

# Créer le dossier de package
$packageDir = "LoftAlgerie-Icons"
if (!(Test-Path $packageDir)) {
    New-Item -ItemType Directory -Path $packageDir -Force
}

# Copier toutes les icônes
Copy-Item "public\icon-512x512.png" "$packageDir\LoftAlgerie-512x512.png" -Force
Copy-Item "public\icon-192x192.png" "$packageDir\LoftAlgerie-192x192.png" -Force
Copy-Item "public\apple-touch-icon.png" "$packageDir\LoftAlgerie-Apple.png" -Force
Copy-Item "public\icon.svg" "$packageDir\LoftAlgerie-Vector.svg" -Force

# Créer un fichier README pour les utilisateurs
$readmeContent = @"
# Icônes Loft Algérie

Ce package contient toutes les icônes de l'application Loft Algérie.

## Fichiers inclus :

### Pour Windows :
- **LoftAlgerie-512x512.png** : Icône haute résolution (recommandée)
- **LoftAlgerie-192x192.png** : Icône standard

### Pour Mac/iOS :
- **LoftAlgerie-Apple.png** : Icône optimisée Apple

### Pour développeurs :
- **LoftAlgerie-Vector.svg** : Icône vectorielle (redimensionnable)

## Comment utiliser :

### Windows :
1. Clic droit sur le raccourci → Propriétés
2. Onglet "Raccourci" → Changer d'icône
3. Parcourir et sélectionner "LoftAlgerie-512x512.png"

### Mac :
1. Sélectionner l'application → Cmd+I (Informations)
2. Glisser "LoftAlgerie-Apple.png" sur l'icône en haut à gauche

### Créer un raccourci personnalisé :
1. Utiliser le script "create-desktop-app.ps1" fourni
2. L'icône sera automatiquement appliquée

---
Application Loft Algérie - Gestion des Lofts
URL: https://loft-algerie.vercel.app
"@

$readmeContent | Out-File -FilePath "$packageDir\README.md" -Encoding UTF8

# Copier aussi le script de création de raccourci
Copy-Item "create-desktop-app.ps1" "$packageDir\Installer-Raccourci-LoftAlgerie.ps1" -Force

Write-Host ""
Write-Host "📦 Package d'icônes créé avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Dossier créé : $packageDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Contenu du package :" -ForegroundColor Cyan
Get-ChildItem $packageDir | ForEach-Object {
    Write-Host "   • $($_.Name)" -ForegroundColor White
}
Write-Host ""
Write-Host "🎁 Vous pouvez maintenant partager ce dossier avec vos utilisateurs !" -ForegroundColor Green