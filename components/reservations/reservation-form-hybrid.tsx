'use client';

import { useState, useEffect, useTransition, useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n/context';
import { Loader2, Calendar, Users, CreditCard, CheckCircle, AlertCircle, Star, Building2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { createReservation } from '@/lib/actions/reservations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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

interface AvailabilityData {
  available: boolean;
  loft_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  nights: number;
  pricing: PricingData | null;
}

interface ReservationFormHybridProps {
  loftId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  onSuccess?: (reservation: any) => void;
  onCancel?: () => void;
}

export default function ReservationFormHybrid({
  loftId,
  initialCheckIn,
  initialCheckOut,
  onSuccess,
  onCancel,
}: ReservationFormHybridProps) {
  const { t } = useTranslation();
  const [lofts, setLofts] = useState<Loft[]>([]);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Form state management
  const [selectedLoft, setSelectedLoft] = useState(loftId || '');
  const [checkInDate, setCheckInDate] = useState(() => {
    return initialCheckIn && initialCheckIn !== '' ? initialCheckIn : format(new Date(), 'yyyy-MM-dd');
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    return initialCheckOut && initialCheckOut !== '' ? initialCheckOut : format(addDays(new Date(), 1), 'yyyy-MM-dd');
  });
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
    if (state?.success && state.data) {
      onSuccess?.(state.data);
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
      const params = new URLSearchParams({
        loft_id: selectedLoft,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        guest_count: guestCount.toString(),
      });

      const response = await fetch(`/api/availability?${params}`);
      if (!response.ok) throw new Error('Failed to check availability');
      
      const data: AvailabilityData = await response.json();
      setAvailabilityData(data);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityData(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = (formData: FormData) => {
    // Validate required fields before submission
    if (!selectedLoft || !checkInDate || !checkOutDate || checkInDate === '' || checkOutDate === '') {
      console.error('Missing required fields:', { selectedLoft, checkInDate, checkOutDate });
      return;
    }

    if (!availabilityData?.available) {
      return;
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  const selectedLoftData = lofts.find(l => l.id === selectedLoft);
  const nights = availabilityData?.nights || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-8">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Calendar className="h-6 w-6" />
            </div>
            {t('reservations.form.title')}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 ml-auto">
              Professional
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form action={handleSubmit} className="space-y-6">
            {/* Hidden fields for server action */}
            <input type="hidden" name="loft_id" value={selectedLoft} />
            <input type="hidden" name="guest_count" value={guestCount} />
            <input type="hidden" name="check_in_date" value={checkInDate} />
            <input type="hidden" name="check_out_date" value={checkOutDate} />

            {/* Display server action errors */}
            {state?.error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-red-800">
                  <div className="font-medium mb-1">Error creating reservation</div>
                  {state.error}
                  {state.details && (
                    <ul className="mt-3 space-y-1">
                      {state.details.map((detail: string, index: number) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-600 rounded-full" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Display success message */}
            {state?.success && (
              <Alert className="border-green-200 bg-green-50/80 backdrop-blur-sm">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-medium">Reservation created successfully!</div>
                  <div className="text-sm mt-1">Your booking has been confirmed and a confirmation email will be sent shortly.</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Property & Guest Selection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Property & Guest Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="loft_select" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    {t('reservations.form.loft')}
                  </Label>
                  <Select
                    value={selectedLoft}
                    onValueChange={setSelectedLoft}
                    disabled={!!loftId}
                  >
                    <SelectTrigger className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder={t('reservations.form.selectLoft')} />
                    </SelectTrigger>
                    <SelectContent>
                      {lofts.map((loft) => (
                        <SelectItem key={loft.id} value={loft.id} className="py-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{loft.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {loft.price_per_night} DZD/night
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="guest_count_select" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    {t('reservations.form.guestCount')}
                  </Label>
                  <Select
                    value={guestCount.toString()}
                    onValueChange={(value) => setGuestCount(parseInt(value))}
                  >
                    <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: selectedLoftData?.max_guests || 8 }, (_, i) => i + 1).map((count) => (
                        <SelectItem key={count} value={count.toString()} className="py-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            {count} {count === 1 ? t('reservations.form.guest') : t('reservations.form.guests')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dates Selection */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Stay Dates</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="check_in" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    {t('reservations.form.checkIn')}
                  </Label>
                  <Input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="check_out" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    {t('reservations.form.checkOut')}
                  </Label>
                  <Input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate ? format(addDays(new Date(checkInDate), 1), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    className="h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Real-time Availability Status (API-powered) */}
            {checkingAvailability && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  {t('reservations.form.checkingAvailability')}
                </AlertDescription>
              </Alert>
            )}

            {availabilityData && !availabilityData.available && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('reservations.form.notAvailable')}
                </AlertDescription>
              </Alert>
            )}

            {availabilityData?.available && availabilityData.pricing && (
              <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-600 rounded-full">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800">{t('reservations.form.available')}</h4>
                        <p className="text-sm text-green-600">Perfect! Your selected dates are available for booking.</p>
                      </div>
                    </div>
                    
                    <div className="bg-white/80 rounded-lg p-4 space-y-3">
                      <h5 className="font-medium text-gray-900 mb-3">Pricing Breakdown</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">{t('reservations.form.basePrice')} ({nights} nights)</span>
                          <span className="font-medium">{availabilityData.pricing.base_price} DZD</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">{t('reservations.form.cleaningFee')}</span>
                          <span className="font-medium">{availabilityData.pricing.cleaning_fee} DZD</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">{t('reservations.form.serviceFee')}</span>
                          <span className="font-medium">{availabilityData.pricing.service_fee} DZD</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600">{t('reservations.form.taxes')}</span>
                          <span className="font-medium">{availabilityData.pricing.taxes} DZD</span>
                        </div>
                        <hr className="my-3" />
                        <div className="flex justify-between items-center py-2 bg-green-100 rounded-lg px-3">
                          <span className="font-semibold text-green-800">{t('reservations.form.total')}</span>
                          <span className="text-xl font-bold text-green-800">{availabilityData.pricing.total_amount} DZD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guest Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{t('reservations.form.guestInfo')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="guest_name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    {t('reservations.form.guestName')}
                  </Label>
                  <Input 
                    name="guest_name" 
                    required 
                    className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="guest_email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    {t('reservations.form.guestEmail')}
                  </Label>
                  <Input 
                    type="email" 
                    name="guest_email" 
                    required 
                    className="h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="guest@example.com"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="guest_phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    {t('reservations.form.guestPhone')}
                  </Label>
                  <Input 
                    name="guest_phone" 
                    required 
                    className="h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    placeholder="+213 xxx xxx xxx"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="guest_nationality" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    {t('reservations.form.guestNationality')}
                  </Label>
                  <Input 
                    name="guest_nationality" 
                    required 
                    className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="e.g., Algerian, French, etc."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="special_requests" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  {t('reservations.form.specialRequests')}
                </Label>
                <Textarea
                  name="special_requests"
                  placeholder={t('reservations.form.specialRequestsPlaceholder')}
                  rows={4}
                  className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-8 border-t border-gray-200">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="h-12 px-8 border-gray-300 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </Button>
              )}
              <Button
                type="submit"
                disabled={!availabilityData?.available || isPending}
                className="h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 flex-1 md:flex-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>{t('reservations.form.creating')}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>{t('reservations.form.createReservation')}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}