# ===========================================
# CORRECTION ERREUR 431 - COOKIES TROP VOLUMINEUX
# ===========================================

Write-Host "🔧 Correction de l'erreur 431 - Request Header Fields Too Large" -ForegroundColor Yellow
Write-Host "=" * 60

Write-Host ""
Write-Host "📋 Causes possibles:" -ForegroundColor Cyan
Write-Host "• Accumulation de cookies Supabase"
Write-Host "• Sessions multiples de développement"
Write-Host "• Cookies expirés non nettoyés"

Write-Host ""
Write-Host "🚀 Solutions disponibles:" -ForegroundColor Green

Write-Host ""
Write-Host "1️⃣ SOLUTION AUTOMATIQUE (Recommandée):" -ForegroundColor Yellow
Write-Host "   Ouvrez: scripts\clear-cookies.html dans votre navigateur"
Write-Host "   Cliquez sur 'Nettoyer tous les cookies'"

Write-Host ""
Write-Host "2️⃣ SOLUTION MANUELLE:" -ForegroundColor Yellow
Write-Host "   • F12 → Application → Storage → Cookies → localhost:3000"
Write-Host "   • Supprimez tous les cookies"

Write-Host ""
Write-Host "3️⃣ SOLUTION TEMPORAIRE:" -ForegroundColor Yellow
Write-Host "   • Ctrl+Shift+N (navigation privée)"
Write-Host "   • Testez sur http://localhost:3000"

Write-Host ""
Write-Host "4️⃣ NETTOYAGE COMPLET:" -ForegroundColor Yellow
Write-Host "   • Suppression du cache Next.js..."

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cache Next.js supprimé" -ForegroundColor Green
} else {
    Write-Host "   ℹ️ Pas de cache Next.js à supprimer" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎯 APRÈS NETTOYAGE:" -ForegroundColor Cyan
Write-Host "• Redémarrez le serveur: npm run dev"
Write-Host "• Vous devrez vous reconnecter"
Write-Host "• L'erreur 431 devrait disparaître"

Write-Host ""
Write-Host "🔄 Pour éviter le problème à l'avenir:" -ForegroundColor Magenta
Write-Host "• Nettoyez périodiquement les cookies de développement"
Write-Host "• Utilisez la navigation privée pour les tests"
Write-Host "• Le middleware vous avertira des cookies volumineux"

Write-Host ""
Write-Host "✅ Script terminé! Nettoyez maintenant vos cookies." -ForegroundColor Green

# Ouvrir automatiquement le fichier de nettoyage
$clearCookiesPath = "scripts\clear-cookies.html"
if (Test-Path $clearCookiesPath) {
    Write-Host ""
    Write-Host "🌐 Ouverture automatique du nettoyeur de cookies..." -ForegroundColor Yellow
    Start-Process $clearCookiesPath
}