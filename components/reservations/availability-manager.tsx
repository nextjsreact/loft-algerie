'use client';

import { useState, useTransition, useActionState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n/context';
import { Calendar, Ban, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { blockDates, unblockDates } from '@/lib/actions/reservations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, addDays } from 'date-fns';

interface Loft {
  id: string;
  name: string;
}

interface AvailabilityManagerProps {
  lofts: Loft[];
  selectedLoftId?: string;
  onUpdate?: () => void;
}

export default function AvailabilityManager({
  lofts,
  selectedLoftId,
  onUpdate,
}: AvailabilityManagerProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'block' | 'unblock'>('block');
  
  // Server action states
  const [blockState, blockAction] = useActionState(blockDates, null);
  const [unblockState, unblockAction] = useActionState(unblockDates, null);

  const handleBlockSubmit = (formData: FormData) => {
    startTransition(() => {
      blockAction(formData);
    });
  };

  const handleUnblockSubmit = (formData: FormData) => {
    startTransition(() => {
      unblockAction(formData);
    });
  };

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('reservations.availability.management')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex gap-2">
            <Button
              variant={mode === 'block' ? 'default' : 'outline'}
              onClick={() => setMode('block')}
              className="flex items-center gap-2"
            >
              <Ban className="h-4 w-4" />
              {t('reservations.availability.blockDates')}
            </Button>
            <Button
              variant={mode === 'unblock' ? 'default' : 'outline'}
              onClick={() => setMode('unblock')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t('reservations.availability.unblockDates')}
            </Button>
          </div>

          {/* Display server action errors */}
          {blockState?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{blockState.error}</AlertDescription>
            </Alert>
          )}

          {unblockState?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{unblockState.error}</AlertDescription>
            </Alert>
          )}

          {/* Block Dates Form */}
          {mode === 'block' && (
            <form action={handleBlockSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loft_id">{t('reservations.availability.selectLoft')}</Label>
                  <Select name="loft_id" defaultValue={selectedLoftId} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('reservations.availability.chooseLoft')} />
                    </SelectTrigger>
                    <SelectContent>
                      {lofts.map((loft) => (
                        <SelectItem key={loft.id} value={loft.id}>
                          {loft.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blocked_reason">{t('reservations.availability.reasonForBlocking')}</Label>
                  <Select name="blocked_reason" required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('reservations.availability.selectReason')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">{t('reservations.availability.maintenance')}</SelectItem>
                      <SelectItem value="personal_use">{t('reservations.availability.personalUse')}</SelectItem>
                      <SelectItem value="renovation">{t('reservations.availability.renovation')}</SelectItem>
                      <SelectItem value="other">{t('reservations.availability.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">{t('reservations.availability.startDate')}</Label>
                  <Input
                    type="date"
                    name="start_date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">{t('reservations.availability.endDate')}</Label>
                  <Input
                    type="date"
                    name="end_date"
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_override">{t('reservations.availability.priceOverride')}</Label>
                  <Input
                    type="number"
                    name="price_override"
                    step="0.01"
                    min="0"
                    placeholder={t('reservations.availability.priceOverridePlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_stay">{t('reservations.availability.minimumStay')}</Label>
                  <Input
                    type="number"
                    name="minimum_stay"
                    min="1"
                    defaultValue="1"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                {t('reservations.availability.blockDates')}
              </Button>
            </form>
          )}

          {/* Unblock Dates Form */}
          {mode === 'unblock' && (
            <form action={handleUnblockSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loft_id">{t('reservations.availability.selectLoft')}</Label>
                <Select name="loft_id" defaultValue={selectedLoftId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('reservations.availability.chooseLoft')} />
                  </SelectTrigger>
                  <SelectContent>
                    {lofts.map((loft) => (
                      <SelectItem key={loft.id} value={loft.id}>
                        {loft.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">{t('reservations.availability.startDate')}</Label>
                  <Input
                    type="date"
                    name="start_date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">{t('reservations.availability.endDate')}</Label>
                  <Input
                    type="date"
                    name="end_date"
                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {t('reservations.availability.unblockDates')}
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}