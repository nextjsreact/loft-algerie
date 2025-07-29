'use client';

import { useState, useEffect, useTransition, useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n/context';
import { Loader2, Calendar, Users, CreditCard } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { createReservation, checkAvailability } from '@/lib/actions/reservations';

interface Loft {
  id: string;
  name: string;
  price_per_night: number;
  max_guests: number;
}

interface PricingData {
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  taxes: number;
  total_amount: number;
}

interface ReservationFormServerActionsProps {
  loftId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onSuccess?: (reservation: any) => void;
  onCancel?: () => void;
}

export default function ReservationFormServerActions({
  loftId,
  initialCheckIn,
  initialCheckOut,
  onSuccess,
  onCancel,
}: ReservationFormServerActionsProps) {
  const { t } = useTranslation();
  const [lofts, setLofts] = useState<Loft[]>([]);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Form state management
  const [selectedLoft, setSelectedLoft] = useState(loftId || '');
  const [checkInDate, setCheckInDate] = useState(initialCheckIn || format(new Date(), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState(initialCheckOut || format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [guestCount, setGuestCount] = useState(1);

  // Server action state
  const [state, formAction] = useActionState(createReservation, null);

  useEffect(() => {
    fetchLofts();
  }, []);

  useEffect(() => {
    if (selectedLoft && checkInDate && checkOutDate) {
      checkAvailabilityAndPricing();
    }
  }, [selectedLoft, checkInDate, checkOutDate, guestCount]);

  // Handle successful reservation creation
  useEffect(() => {
    if (state?.success && state.reservation) {
      onSuccess?.(state.reservation);
    }
  }, [state, onSuccess]);

  const fetchLofts = async () => {
    try {
      const response = await fetch('/api/lofts');
      if (!response.ok) throw new Error('Failed to fetch lofts');
      const data = await response.json();
      setLofts(data.lofts || []);
    } catch (error) {
      console.error('Error fetching lofts:', error);
    }
  };

  const checkAvailabilityAndPricing = async () => {
    if (!selectedLoft || !checkInDate || !checkOutDate) return;
    
    try {
      setCheckingAvailability(true);
      const result = await checkAvailability(selectedLoft, checkInDate, checkOutDate, guestCount);
      
      if (result.error) {
        setAvailability(false);
        setPricing(null);
      } else {
        setAvailability(result.available);
        setPricing(result.pricing);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability(false);
      setPricing(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = (formData: FormData) => {
    if (!availability) {
      alert(t('reservations.form.notAvailable'));
      return;
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const selectedLoftData = lofts.find(l => l.id === selectedLoft);
  const nights = checkInDate && checkOutDate 
    ? Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('reservations.form.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {/* Hidden fields for server action */}
            <input type="hidden" name="loft_id" value={selectedLoft} />
            <input type="hidden" name="guest_count" value={guestCount} />
            <input type="hidden" name="check_in_date" value={checkInDate} />
            <input type="hidden" name="check_out_date" value={checkOutDate} />

            {/* Display server action errors */}
            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{state.error}</p>
              </div>
            )}

            {/* Loft Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loft_select">{t('reservations.form.loft')}</Label>
                <Select
                  value={selectedLoft}
                  onValueChange={setSelectedLoft}
                  disabled={!!loftId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('reservations.form.selectLoft')} />
                  </SelectTrigger>
                  <SelectContent>
                    {lofts.map((loft) => (
                      <SelectItem key={loft.id} value={loft.id}>
                        {loft.name} - {loft.price_per_night} DZD/night
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_count_select">{t('reservations.form.guestCount')}</Label>
                <Select
                  value={guestCount.toString()}
                  onValueChange={(value) => setGuestCount(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: selectedLoftData?.max_guests || 8 }, (_, i) => i + 1).map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} {count === 1 ? t('reservations.form.guest') : t('reservations.form.guests')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check_in">{t('reservations.form.checkIn')}</Label>
                <Input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_out">{t('reservations.form.checkOut')}</Label>
                <Input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  min={checkInDate ? format(addDays(new Date(checkInDate), 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                />
              </div>
            </div>

            {/* Availability Status */}
            {checkingAvailability && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('reservations.form.checkingAvailability')}</span>
              </div>
            )}

            {availability === false && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{t('reservations.form.notAvailable')}</p>
              </div>
            )}

            {availability === true && pricing && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-green-800">{t('reservations.form.available')}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('reservations.form.basePrice')} ({nights} nights)</span>
                    <span>{pricing.base_price} DZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('reservations.form.cleaningFee')}</span>
                    <span>{pricing.cleaning_fee} DZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('reservations.form.serviceFee')}</span>
                    <span>{pricing.service_fee} DZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('reservations.form.taxes')}</span>
                    <span>{pricing.taxes} DZD</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>{t('reservations.form.total')}</span>
                    <span>{pricing.total_amount} DZD</span>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('reservations.form.guestInfo')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest_name">{t('reservations.form.guestName')}</Label>
                  <Input name="guest_name" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_email">{t('reservations.form.guestEmail')}</Label>
                  <Input type="email" name="guest_email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_phone">{t('reservations.form.guestPhone')}</Label>
                  <Input name="guest_phone" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_nationality">{t('reservations.form.guestNationality')}</Label>
                  <Input name="guest_nationality" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_requests">{t('reservations.form.specialRequests')}</Label>
                <Textarea
                  name="special_requests"
                  placeholder={t('reservations.form.specialRequestsPlaceholder')}
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t('common.cancel')}
                </Button>
              )}
              <Button
                type="submit"
                disabled={!availability || isPending}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isPending ? t('reservations.form.creating') : t('reservations.form.createReservation')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}