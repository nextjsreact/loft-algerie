import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const checkAvailabilitySchema = z.object({
  loft_id: z.string().uuid(),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guest_count: z.number().int().min(1).optional().default(1),
});

const getAvailabilityCalendarSchema = z.object({
  loft_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Check if this is a calendar request or availability check
    if (queryParams.start_date && queryParams.end_date) {
      // Calendar view request
      const { loft_id, start_date, end_date } = getAvailabilityCalendarSchema.parse(queryParams);
      
      // Get availability data for the date range
      const { data: availability, error: availabilityError } = await supabase
        .from('loft_availability')
        .select('date, is_available, blocked_reason, price_override, minimum_stay')
        .eq('loft_id', loft_id)
        .gte('date', start_date)
        .lte('date', end_date)
        .order('date');

      if (availabilityError) {
        console.error('Error fetching availability calendar:', availabilityError);
        return NextResponse.json(
          { error: 'Failed to fetch availability calendar' },
          { status: 500 }
        );
      }

      // Get existing reservations for the date range
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('check_in_date, check_out_date, status, guest_name')
        .eq('loft_id', loft_id)
        .or(`and(check_in_date.lte.${end_date},check_out_date.gt.${start_date})`)
        .in('status', ['confirmed', 'pending']);

      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError);
        return NextResponse.json(
          { error: 'Failed to fetch reservations' },
          { status: 500 }
        );
      }

      // Generate complete calendar with all dates
      const calendar = [];
      const currentDate = new Date(start_date);
      const endDateObj = new Date(end_date);

      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Find availability record for this date
        const availabilityRecord = availability?.find(a => a.date === dateStr);
        
        // Check if date is booked by a reservation
        const reservation = reservations?.find(r => 
          dateStr >= r.check_in_date && dateStr < r.check_out_date
        );

        calendar.push({
          date: dateStr,
          is_available: reservation ? false : (availabilityRecord?.is_available ?? true),
          blocked_reason: reservation ? 'booked' : availabilityRecord?.blocked_reason,
          price_override: availabilityRecord?.price_override,
          minimum_stay: availabilityRecord?.minimum_stay || 1,
          reservation: reservation ? {
            status: reservation.status,
            guest_name: reservation.guest_name
          } : null
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return NextResponse.json({ calendar });
    } else {
      // Availability check request
      const { loft_id, check_in_date, check_out_date, guest_count } = 
        checkAvailabilitySchema.parse({
          ...queryParams,
          guest_count: queryParams.guest_count ? parseInt(queryParams.guest_count) : 1,
        });

      // Validate dates
      const checkIn = new Date(check_in_date);
      const checkOut = new Date(check_out_date);
      
      if (checkOut <= checkIn) {
        return NextResponse.json(
          { error: 'Check-out date must be after check-in date' },
          { status: 400 }
        );
      }

      // Check availability using the database function
      const { data: isAvailable, error: availabilityError } = await supabase
        .rpc('check_loft_availability', {
          p_loft_id: loft_id,
          p_check_in: check_in_date,
          p_check_out: check_out_date,
        });

      if (availabilityError) {
        console.error('Error checking availability:', availabilityError);
        return NextResponse.json(
          { error: 'Failed to check availability' },
          { status: 500 }
        );
      }

      // Get pricing if available
      let pricing = null;
      if (isAvailable) {
        const { data: pricingData, error: pricingError } = await supabase
          .rpc('calculate_reservation_price', {
            p_loft_id: loft_id,
            p_check_in: check_in_date,
            p_check_out: check_out_date,
            p_guest_count: guest_count,
          });

        if (!pricingError && pricingData && pricingData.length > 0) {
          pricing = pricingData[0];
        }
      }

      return NextResponse.json({
        available: isAvailable,
        loft_id,
        check_in_date,
        check_out_date,
        guest_count,
        nights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
        pricing
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error in GET /api/availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const blockDatesSchema = z.object({
      loft_id: z.string().uuid(),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      blocked_reason: z.string().min(1).max(100),
      price_override: z.number().optional(),
      minimum_stay: z.number().int().min(1).optional(),
    });

    const { loft_id, start_date, end_date, blocked_reason, price_override, minimum_stay } = 
      blockDatesSchema.parse(body);

    // Validate dates
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    
    if (endDateObj <= startDateObj) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Generate array of dates to block
    const datesToBlock = [];
    const currentDate = new Date(start_date);
    
    while (currentDate < endDateObj) {
      datesToBlock.push({
        loft_id,
        date: currentDate.toISOString().split('T')[0],
        is_available: false,
        blocked_reason,
        price_override,
        minimum_stay: minimum_stay || 1,
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
      return NextResponse.json(
        { error: 'Failed to block dates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Dates blocked successfully',
      blocked_dates: data?.length || 0,
      start_date,
      end_date
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error in POST /api/availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
    const unblockDatesSchema = z.object({
      loft_id: z.string().uuid(),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    const { loft_id, start_date, end_date } = unblockDatesSchema.parse(
      Object.fromEntries(searchParams.entries())
    );

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
      return NextResponse.json(
        { error: 'Failed to unblock dates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Dates unblocked successfully',
      start_date,
      end_date
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error in DELETE /api/availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}