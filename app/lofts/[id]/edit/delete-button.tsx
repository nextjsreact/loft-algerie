"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n/context"

export function DeleteButton({ 
  id,
  onDelete,
  loftName
}: {
  id: string
  onDelete: (id: string) => Promise<void>
  loftName?: string
}) {
  const router = useRouter()
  const { t } = useTranslation()

  const handleClick = async () => {
    if (confirm(`⚠️ Êtes-vous sûr de vouloir supprimer ce loft${loftName ? ` "${loftName}"` : ''} ?\n\nCette action est irréversible et supprimera :\n• Toutes les informations du loft\n• L'historique des factures\n• Les données associées\n\nTapez "SUPPRIMER" pour confirmer.`)) {
      const confirmation = prompt('Pour confirmer la suppression, tapez "SUPPRIMER" en majuscules :')
      
      if (confirmation === 'SUPPRIMER') {
        try {
          // Toast de chargement
          toast.loading("🗑️ Suppression en cours...", {
            description: "Suppression du loft et de toutes ses données associées",
            duration: 2000,
          })
          
          await onDelete(id)
          
          // Toast de succès
          toast.success(`🗑️ Loft${loftName ? ` "${loftName}"` : ''} supprimé avec succès !`, {
            description: "Le loft et toutes ses données ont été définitivement supprimés",
            duration: 4000,
          })
          
          setTimeout(() => {
            router.push("/lofts")
          }, 1500)
        } catch (error) {
          console.error("Delete failed:", error)
          toast.error("❌ Erreur lors de la suppression", {
            description: "Impossible de supprimer le loft. Il pourrait être lié à d'autres données. Contactez le support.",
            duration: 6000,
          })
        }
      } else if (confirmation !== null) {
        toast.warning("⚠️ Suppression annulée", {
          description: "La confirmation n'était pas correcte. Le loft n'a pas été supprimé.",
          duration: 3000,
        })
      }
    }
  }

  return (
    <Button 
      variant="destructive"
      onClick={handleClick}
      className="bg-red-600 hover:bg-red-700 text-white font-medium"
    >
      🗑️ Supprimer le Loft
    </Button>
  )
}
