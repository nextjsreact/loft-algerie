'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n/context';
import { Loader2, Calendar, Users, CreditCard } from 'lucide-react';
import { format, addDays } from 'date-fns';

const reservationSchema = z.object({
  loft_id: z.string().min(1, 'Loft selection is required'),
  guest_name: z.string().min(1, 'Guest name is required').max(255),
  guest_email: z.string().email('Valid email is required'),
  guest_phone: z.string().min(1, 'Phone number is required').max(50),
  guest_nationality: z.string().min(1, 'Nationality is required').max(100),
  guest_count: z.number().int().min(1, 'At least 1 guest is required'),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid check-in date is required'),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid check-out date is required'),
  special_requests: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

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

interface ReservationFormProps {
  loftId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onSuccess?: (reservation: any) => void;
  onCancel?: () => void;
}

export default function ReservationForm({
  loftId,
  initialCheckIn,
  initialCheckOut,
  onSuccess,
  onCancel,
}: ReservationFormProps) {
  const { t } = useTranslation();
  const [lofts, setLofts] = useState<Loft[]>([]);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      loft_id: loftId || '',
      guest_count: 1,
      check_in_date: initialCheckIn || format(new Date(), 'yyyy-MM-dd'),
      check_out_date: initialCheckOut || format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    },
  });

  const watchedValues = watch(['loft_id', 'check_in_date', 'check_out_date', 'guest_count']);

  useEffect(() => {
    fetchLofts();
  }, []);

  useEffect(() => {
    if (watchedValues[0] && watchedValues[1] && watchedValues[2]) {
      checkAvailabilityAndPricing();
    }
  }, watchedValues);

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
    const [selectedLoftId, checkIn, checkOut, guestCount] = watchedValues;
    
    if (!selectedLoftId || !checkIn || !checkOut) return;
    
    try {
      setCheckingAvailability(true);
      const params = new URLSearchParams({
        loft_id: selectedLoftId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count: guestCount.toString(),
      });

      const response = await fetch(`/api/availability?${params}`);
      if (!response.ok) throw new Error('Failed to check availability');
      
      const data = await response.json();
      setAvailability(data.available);
      setPricing(data.pricing);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailability(false);
      setPricing(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const onSubmit = async (data: ReservationFormData) => {
    if (!availability) {
      alert(t('reservations.form.notAvailable'));
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create reservation');
      }

      const reservation = await response.json();
      onSuccess?.(reservation);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert(error instanceof Error ? error.message : 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLoft = lofts.find(l => l.id === watchedValues[0]);
  const nights = watchedValues[1] && watchedValues[2] 
    ? Math.ceil((new Date(watchedValues[2]).getTime() - new Date(watchedValues[1]).getTime()) / (1000 * 60 * 60 * 24))
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Loft Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loft_id">{t('reservations.form.loft')}</Label>
                <Select
                  value={watchedValues[0]}
                  onValueChange={(value) => setValue('loft_id', value)}
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
                {errors.loft_id && (
                  <p className="text-sm text-red-600">{errors.loft_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_count">{t('reservations.form.guestCount')}</Label>
                <Select
                  value={watchedValues[3]?.toString()}
                  onValueChange={(value) => setValue('guest_count', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: selectedLoft?.max_guests || 8 }, (_, i) => i + 1).map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} {count === 1 ? t('reservations.form.guest') : t('reservations.form.guests')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.guest_count && (
                  <p className="text-sm text-red-600">{errors.guest_count.message}</p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="check_in_date">{t('reservations.form.checkIn')}</Label>
                <Input
                  type="date"
                  {...register('check_in_date')}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                {errors.check_in_date && (
                  <p className="text-sm text-red-600">{errors.check_in_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_out_date">{t('reservations.form.checkOut')}</Label>
                <Input
                  type="date"
                  {...register('check_out_date')}
                  min={watchedValues[1] ? format(addDays(new Date(watchedValues[1]), 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                />
                {errors.check_out_date && (
                  <p className="text-sm text-red-600">{errors.check_out_date.message}</p>
                )}
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
                  <Input {...register('guest_name')} />
                  {errors.guest_name && (
                    <p className="text-sm text-red-600">{errors.guest_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_email">{t('reservations.form.guestEmail')}</Label>
                  <Input type="email" {...register('guest_email')} />
                  {errors.guest_email && (
                    <p className="text-sm text-red-600">{errors.guest_email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_phone">{t('reservations.form.guestPhone')}</Label>
                  <Input {...register('guest_phone')} />
                  {errors.guest_phone && (
                    <p className="text-sm text-red-600">{errors.guest_phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest_nationality">{t('reservations.form.guestNationality')}</Label>
                  <Input {...register('guest_nationality')} />
                  {errors.guest_nationality && (
                    <p className="text-sm text-red-600">{errors.guest_nationality.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_requests">{t('reservations.form.specialRequests')}</Label>
                <Textarea
                  {...register('special_requests')}
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
                disabled={!availability || submitting}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {submitting ? t('reservations.form.creating') : t('reservations.form.createReservation')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}