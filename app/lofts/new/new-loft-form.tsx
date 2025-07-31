"use client"

import { LoftForm } from "@/components/forms/loft-form"
import { createLoft } from "@/app/actions/lofts"
import type { LoftOwner, InternetConnectionType } from "@/lib/types"
import type { ZoneArea } from "@/app/actions/zone-areas"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface NewLoftFormWrapperProps {
  owners: LoftOwner[];
  zoneAreas: ZoneArea[];
  internetConnectionTypes: InternetConnectionType[];
}

export function NewLoftFormWrapper({ owners, zoneAreas, internetConnectionTypes }: NewLoftFormWrapperProps) {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    try {
      const result = await createLoft(data)
      if (result?.success) {
        toast.success(`🏠 Loft "${data.name}" créé avec succès !`, {
          description: "Le loft a été ajouté à votre système de gestion",
          duration: 4000,
        })
        setTimeout(() => {
          router.push("/lofts")
        }, 1500)
      } else {
        toast.error("❌ Erreur lors de la création", {
          description: "Impossible de créer le loft. Vérifiez vos données et réessayez.",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Error creating loft:', error)
      toast.error("💥 Erreur système", {
        description: "Une erreur inattendue s'est produite. Contactez le support si le problème persiste.",
        duration: 6000,
      })
    }
  }

  return <LoftForm owners={owners} zoneAreas={zoneAreas} internetConnectionTypes={internetConnectionTypes} onSubmit={handleSubmit} />
}
