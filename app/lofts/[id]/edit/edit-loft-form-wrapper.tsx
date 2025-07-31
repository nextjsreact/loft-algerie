"use client"

import { useRouter } from "next/navigation"
import { LoftForm } from "@/components/forms/loft-form"
import { updateLoft } from "@/app/actions/lofts"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n/context"

export function EditLoftFormWrapper({ loft, owners, zoneAreas, internetConnectionTypes }: any) {
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = async (data: any) => {
    try {
      const result = await updateLoft(loft.id, data)
      if (result?.success) {
        toast.success(`🏠 Loft "${loft.name}" mis à jour avec succès !`, {
          description: "Toutes les modifications ont été sauvegardées",
          duration: 4000,
        })
        setTimeout(() => {
          router.push("/lofts")
        }, 1500)
      } else {
        toast.error("❌ Erreur lors de la mise à jour", {
          description: "Impossible de sauvegarder les modifications. Vérifiez vos données et réessayez.",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error updating loft:', error)
      toast.error("💥 Erreur système", {
        description: "Une erreur inattendue s'est produite lors de la mise à jour. Contactez le support si le problème persiste.",
        duration: 6000,
      })
    }
  }

  return <LoftForm key={loft.id} loft={loft} owners={owners} zoneAreas={zoneAreas} internetConnectionTypes={internetConnectionTypes} onSubmit={handleSubmit} />
}
