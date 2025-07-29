'use client';

import { useTransition, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n/context';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { 
  confirmReservation, 
  completeReservation, 
  cancelReservation 
} from '@/lib/actions/reservations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Reservation {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  lofts: {
    name: string;
  };
}

interface ReservationStatusActionsProps {
  reservation: Reservation;
  onUpdate?: (reservation: Reservation) => void;
}

export default function ReservationStatusActions({
  reservation,
  onUpdate,
}: ReservationStatusActionsProps) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [cancelState, cancelAction] = useActionState(cancelReservation, null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmReservation(reservation.id);
      if (result.success && result.data) {
        onUpdate?.(result.data);
      }
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeReservation(reservation.id);
      if (result.success && result.data) {
        onUpdate?.(result.data);
      }
    });
  };

  const handleCancelSubmit = (formData: FormData) => {
    formData.append('reservation_id', reservation.id);
    startTransition(() => {
      cancelAction(formData);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon(reservation.status)}
            {t('reservations.details.title')}
          </span>
          <Badge className={getStatusColor(reservation.status)}>
            {t(`reservations.status.${reservation.status}`)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reservation Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">{t('reservations.details.guest')}</h4>
            <p>{reservation.guest_name}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('reservations.details.dates')}</h4>
            <p>{reservation.check_in_date} - {reservation.check_out_date}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold">{t('reservations.details.loft')}</h4>
          <p>{reservation.lofts?.name}</p>
        </div>
        
        <div>
          <h4 className="font-semibold">{t('reservations.details.total')}</h4>
          <p className="text-lg font-bold">{reservation.total_amount} DZD</p>
        </div>

        {/* Status-specific Actions */}
        <div className="flex gap-2 pt-4">
          {reservation.status === 'pending' && (
            <>
              <Button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Confirm Reservation
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Cancel Reservation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Reservation</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for cancelling this reservation.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {cancelState?.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{cancelState.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <form action={handleCancelSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cancellation_reason">Cancellation Reason</Label>
                      <Textarea
                        name="cancellation_reason"
                        placeholder="Please explain why this reservation is being cancelled..."
                        required
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={isPending}
                        className="flex items-center gap-2"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Cancel Reservation
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {reservation.status === 'confirmed' && (
            <Button
              onClick={handleComplete}
              disabled={isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Mark as Completed
            </Button>
          )}
        </div>

        {/* Success/Error Messages */}
        {cancelState?.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Reservation cancelled successfully.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}