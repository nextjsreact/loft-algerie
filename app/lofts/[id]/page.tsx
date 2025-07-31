import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoftBillManagement } from "@/components/loft/bill-management"
import Link from "next/link"

export default async function LoftDetailPage({ params }: { params: { id: string } }) {
  const awaitedParams = await params;
  const session = await requireRole(["admin", "manager"])
  const supabase = await createClient()

  const { data: loft, error } = await supabase
    .from("lofts")
    .select(
      `
      *,
      loft_owners (name, ownership_type)
    `
    )
    .eq("id", awaitedParams.id)
    .single()

  if (!loft) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{loft.name}</h1>
        <p className="text-muted-foreground">{loft.address}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loft Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{loft.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Rent</p>
              <p className="font-medium">{loft.price_per_month} DA</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium">{loft.loft_owners?.name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ownership Type</p>
              <p className="font-medium capitalize">{loft.loft_owners?.ownership_type?.replace('_', ' ')}</p>
            </div>
          </div>
          {loft.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{loft.description}</p>
            </div>
          )}
          <div className="mt-6 flex gap-4">
            <Button asChild>
              <Link href={`/lofts/${awaitedParams.id}/edit`}>Edit Loft</Link>
            </Button>
            <Button asChild>
              <Link href={`/lofts/${awaitedParams.id}/link-airbnb`}>Link to Airbnb</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <LoftBillManagement loftId={awaitedParams.id} loftData={loft} />
    </div>
  )
}
