import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const updateReservationSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  special_requests: z.string().optional(),
  cancellation_reason: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        *,
        lofts:loft_id (
          id,
          name,
          address,
          price_per_night,
          amenities,
          images
        ),
        reservation_payments (
          id,
          amount,
          currency,
          payment_method,
          status,
          created_at,
          processed_at
        ),
        guest_communications (
          id,
          sender_type,
          message_type,
          subject,
          message,
          is_read,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching reservation:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error in GET /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = updateReservationSchema.parse(body);

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString(),
    };

    // Handle status changes
    if (validatedData.status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (!validatedData.cancellation_reason) {
        return NextResponse.json(
          { error: 'Cancellation reason is required when cancelling a reservation' },
          { status: 400 }
        );
      }
    }

    // Update reservation
    const { data: reservation, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
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
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }
      console.error('Error updating reservation:', error);
      return NextResponse.json(
        { error: 'Failed to update reservation' },
        { status: 500 }
      );
    }

    // Handle post-update actions
    if (validatedData.status === 'confirmed') {
      // Send confirmation email and check-in instructions
      // await sendCheckInInstructions(reservation);
    } else if (validatedData.status === 'cancelled') {
      // Process refund if applicable
      // await processRefund(reservation);
    }

    return NextResponse.json(reservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error in PATCH /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    // Check if reservation can be deleted (only pending reservations)
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('status, payment_status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching reservation for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch reservation' },
        { status: 500 }
      );
    }

    if (reservation.status !== 'pending' || reservation.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Only pending unpaid reservations can be deleted' },
        { status: 400 }
      );
    }

    // Delete reservation
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting reservation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete reservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}