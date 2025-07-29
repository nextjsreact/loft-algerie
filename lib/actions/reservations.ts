'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Types for better type safety
interface ActionResult<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
  details?: any;
}

const createReservationSchema = z.object({
  loft_id: z.string().uuid(),
  guest_name: z.string().min(1).max(255),
  guest_email: z.string().email(),
  guest_phone: z.string().min(1).max(50),
  guest_nationality: z.string().min(1).max(100),
  guest_count: z.coerce.number().int().min(1),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  special_requests: z.string().optional(),
});

export async function createReservation(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createClient();
    
    // Validate form data
    const validatedData = createReservationSchema.parse({
      loft_id: formData.get('loft_id'),
      guest_name: formData.get('guest_name'),
      guest_email: formData.get('guest_email'),
      guest_phone: formData.get('guest_phone'),
      guest_nationality: formData.get('guest_nationality'),
      guest_count: formData.get('guest_count'),
      check_in_date: formData.get('check_in_date'),
      check_out_date: formData.get('check_out_date'),
      special_requests: formData.get('special_requests') || '',
    });

    // Check if dates are valid
    const checkIn = new Date(validatedData.check_in_date);
    const checkOut = new Date(validatedData.check_out_date);
    
    if (checkOut <= checkIn) {
      return { error: 'Check-out date must be after check-in date' };
    }
    
    if (checkIn < new Date()) {
      return { error: 'Check-in date cannot be in the past' };
    }

    // Check availability
    const { data: availabilityCheck, error: availabilityError } = await supabase
      .rpc('check_loft_availability', {
        p_loft_id: validatedData.loft_id,
        p_check_in: validatedData.check_in_date,
        p_check_out: validatedData.check_out_date,
      });

    if (availabilityError) {
      console.error('Error checking availability:', availabilityError);
      return { error: 'Failed to check availability' };
    }

    if (!availabilityCheck) {
      return { error: 'Selected dates are not available' };
    }

    // Calculate pricing
    const { data: pricing, error: pricingError } = await supabase
      .rpc('calculate_reservation_price', {
        p_loft_id: validatedData.loft_id,
        p_check_in: validatedData.check_in_date,
        p_check_out: validatedData.check_out_date,
        p_guest_count: validatedData.guest_count,
      });

    if (pricingError || !pricing || pricing.length === 0) {
      console.error('Error calculating pricing:', pricingError);
      return { error: 'Failed to calculate pricing' };
    }

    const priceData = pricing[0];

    // Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        ...validatedData,
        base_price: priceData.base_price,
        cleaning_fee: priceData.cleaning_fee,
        service_fee: priceData.service_fee,
        taxes: priceData.taxes,
        total_amount: priceData.total_amount,
        status: 'pending',
        payment_status: 'pending',
      })
      .select(`
        *,
        lofts:loft_id (
          id,
          name,
          address,
          price_per_night
        )
      `)
      .single();

    if (reservationError) {
      console.error('Error creating reservation:', reservationError);
      return { error: 'Failed to create reservation' };
    }

    // Revalidate the reservations page
    revalidatePath('/reservations');
    
    return { success: true, data: reservation };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid form data', 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    
    console.error('Error in createReservation:', error);
    return { error: 'Internal server error' };
  }
}

export async function updateReservationStatus(
  reservationId: string, 
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed', 
  cancellationReason?: string
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
    }

    const { data: reservation, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select(`
        *,
        lofts:loft_id (
          id,
          name,
          address,
          price_per_night
        )
      `)
      .single();

    if (error) {
      console.error('Error updating reservation:', error);
      return { error: 'Failed to update reservation' };
    }

    revalidatePath('/reservations');
    revalidatePath(`/reservations/${reservationId}`);
    
    return { success: true, data: reservation };
  } catch (error) {
    console.error('Error in updateReservationStatus:', error);
    return { error: 'Internal server error' };
  }
}

export async function cancelReservation(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const reservationId = formData.get('reservation_id') as string;
    const cancellationReason = formData.get('cancellation_reason') as string;
    
    if (!reservationId) {
      return { error: 'Reservation ID is required' };
    }

    return await updateReservationStatus(reservationId, 'cancelled', cancellationReason);
  } catch (error) {
    console.error('Error in cancelReservation:', error);
    return { error: 'Internal server error' };
  }
}

export async function confirmReservation(reservationId: string): Promise<ActionResult> {
  return await updateReservationStatus(reservationId, 'confirmed');
}

export async function completeReservation(reservationId: string): Promise<ActionResult> {
  return await updateReservationStatus(reservationId, 'completed');
}

export async function checkAvailability(loftId: string, checkIn: string, checkOut: string, guestCount: number = 1) {
  try {
    const supabase = createClient();
    
    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkOutDate <= checkInDate) {
      return { error: 'Check-out date must be after check-in date' };
    }

    // Check availability using the database function
    const { data: isAvailable, error: availabilityError } = await supabase
      .rpc('check_loft_availability', {
        p_loft_id: loftId,
        p_check_in: checkIn,
        p_check_out: checkOut,
      });

    if (availabilityError) {
      console.error('Error checking availability:', availabilityError);
      return { error: 'Failed to check availability' };
    }

    // Get pricing if available
    let pricing = null;
    if (isAvailable) {
      const { data: pricingData, error: pricingError } = await supabase
        .rpc('calculate_reservation_price', {
          p_loft_id: loftId,
          p_check_in: checkIn,
          p_check_out: checkOut,
          p_guest_count: guestCount,
        });

      if (!pricingError && pricingData && pricingData.length > 0) {
        pricing = pricingData[0];
      }
    }

    return {
      available: isAvailable,
      loft_id: loftId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      guest_count: guestCount,
      nights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
      pricing
    };
  } catch (error) {
    console.error('Error in checkAvailability:', error);
    return { error: 'Internal server error' };
  }
}

// Availability Management Server Actions
const blockDatesSchema = z.object({
  loft_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocked_reason: z.string().min(1).max(100),
  price_override: z.coerce.number().optional(),
  minimum_stay: z.coerce.number().int().min(1).optional(),
});

export async function blockDates(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createClient();
    
    const validatedData = blockDatesSchema.parse({
      loft_id: formData.get('loft_id'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      blocked_reason: formData.get('blocked_reason'),
      price_override: formData.get('price_override'),
      minimum_stay: formData.get('minimum_stay'),
    });

    // Validate dates
    const startDateObj = new Date(validatedData.start_date);
    const endDateObj = new Date(validatedData.end_date);
    
    if (endDateObj <= startDateObj) {
      return { error: 'End date must be after start date' };
    }

    // Generate array of dates to block
    const datesToBlock = [];
    const currentDate = new Date(validatedData.start_date);
    
    while (currentDate < endDateObj) {
      datesToBlock.push({
        loft_id: validatedData.loft_id,
        date: currentDate.toISOString().split('T')[0],
        is_available: false,
        blocked_reason: validatedData.blocked_reason,
        price_override: validatedData.price_override,
        minimum_stay: validatedData.minimum_stay || 1,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Insert or update availability records
    const { data, error } = await supabase
      .from('loft_availability')
      .upsert(datesToBlock, { 
        onConflict: 'loft_id,date',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error blocking dates:', error);
      return { error: 'Failed to block dates' };
    }

    revalidatePath('/reservations');
    revalidatePath('/availability');
    
    return { 
      success: true, 
      data: {
        blocked_dates: data?.length || 0,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid form data', 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    
    console.error('Error in blockDates:', error);
    return { error: 'Internal server error' };
  }
}

export async function unblockDates(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createClient();
    
    const loft_id = formData.get('loft_id') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;

    if (!loft_id || !start_date || !end_date) {
      return { error: 'Loft ID, start date, and end date are required' };
    }

    // Delete availability records (which will make dates available by default)
    const { error } = await supabase
      .from('loft_availability')
      .delete()
      .eq('loft_id', loft_id)
      .gte('date', start_date)
      .lt('date', end_date)
      .neq('blocked_reason', 'booked'); // Don't unblock booked dates

    if (error) {
      console.error('Error unblocking dates:', error);
      return { error: 'Failed to unblock dates' };
    }

    revalidatePath('/reservations');
    revalidatePath('/availability');
    
    return { 
      success: true, 
      data: { start_date, end_date }
    };
  } catch (error) {
    console.error('Error in unblockDates:', error);
    return { error: 'Internal server error' };
  }
}

// Guest Communication Server Actions
const sendMessageSchema = z.object({
  reservation_id: z.string().uuid(),
  message_type: z.enum(['booking_confirmation', 'check_in_instructions', 'general_inquiry', 'support_request', 'review_request']),
  subject: z.string().min(1).max(255).optional(),
  message: z.string().min(1),
});

export async function sendGuestMessage(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const supabase = createClient();
    
    const validatedData = sendMessageSchema.parse({
      reservation_id: formData.get('reservation_id'),
      message_type: formData.get('message_type'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    });

    // Get current user (would need proper auth implementation)
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: communication, error } = await supabase
      .from('guest_communications')
      .insert({
        ...validatedData,
        sender_type: 'owner', // or 'system' based on context
        sender_id: user?.id,
        is_automated: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { error: 'Failed to send message' };
    }

    revalidatePath(`/reservations/${validatedData.reservation_id}`);
    
    return { success: true, data: communication };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        error: 'Invalid form data', 
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
      };
    }
    
    console.error('Error in sendGuestMessage:', error);
    return { error: 'Internal server error' };
  }
}