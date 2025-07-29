"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState, useCallback } from "react"
import type { Loft, LoftOwner, InternetConnectionType } from "@/lib/types"
import type { ZoneArea } from "@/app/actions/zone-areas"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/lib/i18n/context"

interface LoftFormProps {
  owners: LoftOwner[]
  zoneAreas: ZoneArea[]
  internetConnectionTypes: InternetConnectionType[]
  onSubmit: (data: any) => Promise<void>
  loft?: Loft | null
}

export function LoftForm({ owners, zoneAreas, internetConnectionTypes, onSubmit, loft }: LoftFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    price_per_month: "",
    owner_id: "",
    zone_area_id: "",
    internet_connection_type_id: "",
    description: "",
    water_customer_code: "",
    water_contract_code: "",
    water_meter_number: "",
    electricity_pdl_ref: "",
    electricity_customer_number: "",
    electricity_meter_number: "",
    gas_pdl_ref: "",
    gas_customer_number: "",
    gas_meter_number: "",
    phone_number: "",
    company_percentage: "",
    owner_percentage: "",
    frequence_paiement_eau: "",
    prochaine_echeance_eau: "",
    frequence_paiement_energie: "",
    prochaine_echeance_energie: "",
    frequence_paiement_telephone: "",
    prochaine_echeance_telephone: "",
    frequence_paiement_internet: "",
    prochaine_echeance_internet: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Function to populate form data (extracted so we can reuse it)
  const populateFormData = useCallback(() => {
    if (loft && loft.id) {
      console.log('✅ Populating form with loft data:', loft)
      
      const formDataToSet = {
        name: loft.name || "",
        address: loft.address || "",
        price_per_month: loft.price_per_month?.toString() || "",
        owner_id: loft.owner_id || "",
        zone_area_id: loft.zone_area_id || "",
        internet_connection_type_id: loft.internet_connection_type_id || "",
        description: loft.description || "",
        water_customer_code: loft.water_customer_code || "",
        water_contract_code: loft.water_contract_code || "",
        water_meter_number: loft.water_meter_number || "",
        electricity_pdl_ref: loft.electricity_pdl_ref || "",
        electricity_customer_number: loft.electricity_customer_number || "",
        electricity_meter_number: loft.electricity_meter_number || "",
        gas_pdl_ref: loft.gas_pdl_ref || "",
        gas_customer_number: loft.gas_customer_number || "",
        gas_meter_number: loft.gas_meter_number || "",
        phone_number: loft.phone_number || "",
        company_percentage: loft.company_percentage?.toString() || "",
        owner_percentage: loft.owner_percentage?.toString() || "",
        frequence_paiement_eau: loft.frequence_paiement_eau || "",
        prochaine_echeance_eau: loft.prochaine_echeance_eau || "",
        frequence_paiement_energie: loft.frequence_paiement_energie || "",
        prochaine_echeance_energie: loft.prochaine_echeance_energie || "",
        frequence_paiement_telephone: loft.frequence_paiement_telephone || "",
        prochaine_echeance_telephone: loft.prochaine_echeance_telephone || "",
        frequence_paiement_internet: loft.frequence_paiement_internet || "",
        prochaine_echeance_internet: loft.prochaine_echeance_internet || "",
      }
      
      console.log('🗂️ Setting form data:', formDataToSet)
      setFormData(formDataToSet)
    }
  }, [loft])

  // Multiple useEffect hooks to catch different timing scenarios
  useEffect(() => {
    console.log('🔄 useEffect [loft] - loft changed:', loft?.id)
    populateFormData()
  }, [loft, populateFormData])

  useEffect(() => {
    console.log('🔄 useEffect [loft.id] - loft ID changed:', loft?.id)
    if (loft?.id) {
      // Small delay to ensure all data is loaded
      setTimeout(() => {
        populateFormData()
      }, 50)
    }
  }, [loft?.id, populateFormData])

  // Also populate on component mount if loft data is already available
  useEffect(() => {
    console.log('🔄 useEffect mount - checking for existing loft data')
    if (loft?.id) {
      populateFormData()
    }
  }, []) // Empty dependency array for mount only

  const safeInternetConnectionTypes = Array.isArray(internetConnectionTypes) ? internetConnectionTypes : []

  console.log("LoftForm component is rendering"); // Basic log to confirm client-side rendering

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Convert empty date strings to null to prevent database errors
      const processedData = {
        ...formData,
        price_per_month: Number(formData.price_per_month),
        company_percentage: Number(formData.company_percentage),
        owner_percentage: Number(formData.owner_percentage),
        // Convert empty date strings to null
        prochaine_echeance_eau: formData.prochaine_echeance_eau || null,
        prochaine_echeance_energie: formData.prochaine_echeance_energie || null,
        prochaine_echeance_telephone: formData.prochaine_echeance_telephone || null,
        prochaine_echeance_internet: formData.prochaine_echeance_internet || null,
      }
      
      await onSubmit(processedData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>

      
      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Label htmlFor="name">{t('lofts.loftName')} *</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">{t('lofts.loftAddress')} *</Label>
          <Input id="address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">{t('lofts.pricePerMonth')} ($) *</Label>
          <Input id="price" type="number" value={formData.price_per_month} onChange={(e) => setFormData({...formData, price_per_month: e.target.value})} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner">{t('lofts.owner')}</Label>
          <Select value={formData.owner_id || ""} onValueChange={(value) => setFormData({...formData, owner_id: value})}>
            <SelectTrigger><SelectValue placeholder={t('common.selectOption')} /></SelectTrigger>
            <SelectContent>
              {Array.isArray(owners) && owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="zone">{t('lofts.zoneArea')}</Label>
          <Select value={formData.zone_area_id || ""} onValueChange={(value) => setFormData({...formData, zone_area_id: value})}>
            <SelectTrigger><SelectValue placeholder={t('common.selectOption')} /></SelectTrigger>
            <SelectContent>
              {Array.isArray(zoneAreas) && zoneAreas.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="internet">{t('lofts.internetConnection')}</Label>
          <Select value={formData.internet_connection_type_id || ""} onValueChange={(value) => setFormData({...formData, internet_connection_type_id: value})}>
            <SelectTrigger><SelectValue placeholder={t('common.selectOption')} /></SelectTrigger>
            <SelectContent>
              {safeInternetConnectionTypes.map((connection) => (
                <SelectItem key={connection.id} value={connection.id}>
                  {connection.type} {connection.speed && `- ${connection.speed}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_percentage">{t('lofts.companyPercentage')} (%) *</Label>
          <Input 
            id="company_percentage" 
            type="number" 
            min="0" 
            max="100" 
            step="0.01"
            value={formData.company_percentage} 
            onChange={(e) => {
              const companyPercentage = e.target.value
              const ownerPercentage = companyPercentage && !isNaN(Number(companyPercentage)) 
                ? (100 - Number(companyPercentage)).toString() 
                : ""
              setFormData({
                ...formData, 
                company_percentage: companyPercentage,
                owner_percentage: ownerPercentage
              })
            }} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner_percentage">{t('lofts.ownerPercentage')} (%) *</Label>
          <Input 
            id="owner_percentage" 
            type="number" 
            min="0" 
            max="100" 
            step="0.01"
            value={formData.owner_percentage} 
            onChange={(e) => {
              const ownerPercentage = e.target.value
              const companyPercentage = ownerPercentage && !isNaN(Number(ownerPercentage))
                ? (100 - Number(ownerPercentage)).toString() 
                : ""
              setFormData({
                ...formData, 
                owner_percentage: ownerPercentage,
                company_percentage: companyPercentage
              })
            }} 
            required 
          />
          <p className="text-xs text-muted-foreground">
            {t('lofts.total')}: {(Number(formData.company_percentage || 0) + Number(formData.owner_percentage || 0)).toFixed(1)}% 
            {(Number(formData.company_percentage || 0) + Number(formData.owner_percentage || 0)) === 100 ? 
              " ✅" : ` (${t('lofts.shouldEqual100')})`}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('lofts.loftDescription')}</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium">{t('lofts.utilityInformation')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="water_customer_code">{t('lofts.waterCustomerCode')}</Label>
            <Input id="water_customer_code" value={formData.water_customer_code} onChange={(e) => setFormData({...formData, water_customer_code: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="water_contract_code">{t('lofts.waterContractCode')}</Label>
            <Input id="water_contract_code" value={formData.water_contract_code} onChange={(e) => setFormData({...formData, water_contract_code: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="water_meter_number">{t('lofts.waterMeterNumber')}</Label>
            <Input id="water_meter_number" value={formData.water_meter_number} onChange={(e) => setFormData({...formData, water_meter_number: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="electricity_pdl_ref">{t('lofts.electricityPdlRef')}</Label>
            <Input id="electricity_pdl_ref" value={formData.electricity_pdl_ref} onChange={(e) => setFormData({...formData, electricity_pdl_ref: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="electricity_customer_number">{t('lofts.electricityCustomerNumber')}</Label>
            <Input id="electricity_customer_number" value={formData.electricity_customer_number} onChange={(e) => setFormData({...formData, electricity_customer_number: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="electricity_meter_number">{t('lofts.electricityMeterNumber')}</Label>
            <Input id="electricity_meter_number" value={formData.electricity_meter_number} onChange={(e) => setFormData({...formData, electricity_meter_number: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gas_pdl_ref">{t('lofts.gasPdlRef')}</Label>
            <Input id="gas_pdl_ref" value={formData.gas_pdl_ref} onChange={(e) => setFormData({...formData, gas_pdl_ref: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gas_customer_number">{t('lofts.gasCustomerNumber')}</Label>
            <Input id="gas_customer_number" value={formData.gas_customer_number} onChange={(e) => setFormData({...formData, gas_customer_number: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gas_meter_number">{t('lofts.gasMeterNumber')}</Label>
            <Input id="gas_meter_number" value={formData.gas_meter_number} onChange={(e) => setFormData({...formData, gas_meter_number: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">{t('lofts.phoneNumber')}</Label>
            <Input id="phone_number" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium">{t('lofts.billingAlerts')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label htmlFor="frequence_paiement_eau">{t('lofts.waterBillFrequency')}</Label>
            <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_eau: value})} value={formData.frequence_paiement_eau}>
              <SelectTrigger>
                <SelectValue placeholder={t('lofts.selectFrequency')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hebdomadaire">{t('lofts.frequency.weekly')}</SelectItem>
                <SelectItem value="mensuel">{t('lofts.frequency.monthly')}</SelectItem>
                <SelectItem value="bimestriel">{t('lofts.frequency.bimonthly')}</SelectItem>
                <SelectItem value="trimestriel">{t('lofts.frequency.quarterly')}</SelectItem>
                <SelectItem value="quadrimestriel">{t('lofts.frequency.fourMonthly')}</SelectItem>
                <SelectItem value="semestriel">{t('lofts.frequency.sixMonthly')}</SelectItem>
                <SelectItem value="annuel">{t('lofts.frequency.yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prochaine_echeance_eau">{t('lofts.nextWaterBill')}</Label>
            <Input id="prochaine_echeance_eau" type="date" value={formData.prochaine_echeance_eau} onChange={(e) => setFormData({...formData, prochaine_echeance_eau: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequence_paiement_energie">{t('lofts.energyBillFrequency')}</Label>
            <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_energie: value})} value={formData.frequence_paiement_energie}>
              <SelectTrigger>
                <SelectValue placeholder={t('lofts.selectFrequency')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hebdomadaire">{t('lofts.frequency.weekly')}</SelectItem>
                <SelectItem value="mensuel">{t('lofts.frequency.monthly')}</SelectItem>
                <SelectItem value="bimestriel">{t('lofts.frequency.bimonthly')}</SelectItem>
                <SelectItem value="trimestriel">{t('lofts.frequency.quarterly')}</SelectItem>
                <SelectItem value="quadrimestriel">{t('lofts.frequency.fourMonthly')}</SelectItem>
                <SelectItem value="semestriel">{t('lofts.frequency.sixMonthly')}</SelectItem>
                <SelectItem value="annuel">{t('lofts.frequency.yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prochaine_echeance_energie">{t('lofts.nextEnergyBill')}</Label>
            <Input id="prochaine_echeance_energie" type="date" value={formData.prochaine_echeance_energie} onChange={(e) => setFormData({...formData, prochaine_echeance_energie: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequence_paiement_telephone">{t('lofts.phoneBillFrequency')}</Label>
            <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_telephone: value})} value={formData.frequence_paiement_telephone}>
              <SelectTrigger>
                <SelectValue placeholder={t('lofts.selectFrequency')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hebdomadaire">{t('lofts.frequency.weekly')}</SelectItem>
                <SelectItem value="mensuel">{t('lofts.frequency.monthly')}</SelectItem>
                <SelectItem value="bimestriel">{t('lofts.frequency.bimonthly')}</SelectItem>
                <SelectItem value="trimestriel">{t('lofts.frequency.quarterly')}</SelectItem>
                <SelectItem value="quadrimestriel">{t('lofts.frequency.fourMonthly')}</SelectItem>
                <SelectItem value="semestriel">{t('lofts.frequency.sixMonthly')}</SelectItem>
                <SelectItem value="annuel">{t('lofts.frequency.yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prochaine_echeance_telephone">{t('lofts.nextPhoneBill')}</Label>
            <Input id="prochaine_echeance_telephone" type="date" value={formData.prochaine_echeance_telephone} onChange={(e) => setFormData({...formData, prochaine_echeance_telephone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequence_paiement_internet">{t('lofts.internetBillFrequency')}</Label>
            <Select onValueChange={(value) => setFormData({...formData, frequence_paiement_internet: value})} value={formData.frequence_paiement_internet}>
              <SelectTrigger>
                <SelectValue placeholder={t('lofts.selectFrequency')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hebdomadaire">{t('lofts.frequency.weekly')}</SelectItem>
                <SelectItem value="mensuel">{t('lofts.frequency.monthly')}</SelectItem>
                <SelectItem value="bimestriel">{t('lofts.frequency.bimonthly')}</SelectItem>
                <SelectItem value="trimestriel">{t('lofts.frequency.quarterly')}</SelectItem>
                <SelectItem value="quadrimestriel">{t('lofts.frequency.fourMonthly')}</SelectItem>
                <SelectItem value="semestriel">{t('lofts.frequency.sixMonthly')}</SelectItem>
                <SelectItem value="annuel">{t('lofts.frequency.yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prochaine_echeance_internet">{t('lofts.nextInternetBill')}</Label>
            <Input id="prochaine_echeance_internet" type="date" value={formData.prochaine_echeance_internet} onChange={(e) => setFormData({...formData, prochaine_echeance_internet: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (loft ? t('lofts.updating') : t('lofts.creating')) : (loft ? t('lofts.updateLoft') : t('lofts.createLoft'))}
        </Button>
      </div>
    </form>
    </div>
  )
}
