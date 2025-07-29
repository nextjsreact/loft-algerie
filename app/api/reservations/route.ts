import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

// Validation schemas for API-only operations
const searchReservationsSchema = z.object({
  loft_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
  guest_email: z.string().email().optional(),
  check_in_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  check_in_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // First, let's test basic connection
    console.log('Testing Supabase connection...');
    
    // Test if reservations table exists
    const { data: testData, error: testError } = await supabase
      .from('reservations')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('Reservations table error:', testError);
      return NextResponse.json(
        { error: 'Database connection failed', details: testError.message },
        { status: 500 }
      );
    }
    
    console.log('Reservations table accessible');
    
    // Test if lofts table exists
    const { data: loftsTest, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name')
      .limit(1);
    
    if (loftsError) {
      console.error('Lofts table error:', loftsError);
      return NextResponse.json(
        { error: 'Lofts table not accessible', details: loftsError.message },
        { status: 500 }
      );
    }
    
    console.log('Lofts table accessible');
    
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries());
    const { loft_id, status, guest_email, check_in_from, check_in_to, page, limit } = 
      searchReservationsSchema.parse({
        ...queryParams,
        page: queryParams.page ? parseInt(queryParams.page) : 1,
        limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      });

    // Build query - simplified first
    let query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (loft_id) query = query.eq('loft_id', loft_id);
    if (status) query = query.eq('status', status);
    if (guest_email) query = query.eq('guest_email', guest_email);
    if (check_in_from) query = query.gte('check_in_date', check_in_from);
    if (check_in_to) query = query.lte('check_in_date', check_in_to);

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: reservations, error, count } = await query;

    if (error) {
      console.error('Error fetching reservations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reservations', details: error.message },
        { status: 500 }
      );
    }

    // If we have reservations, try to get loft data separately
    const reservationsWithLofts = [];
    if (reservations && reservations.length > 0) {
      for (const reservation of reservations) {
        const { data: loft } = await supabase
          .from('lofts')
          .select('id, name, address, price_per_night')
          .eq('id', reservation.loft_id)
          .single();
        
        reservationsWithLofts.push({
          ...reservation,
          lofts: loft || { name: 'Unknown Loft' }
        });
      }
    }

    return NextResponse.json({
      reservations: reservationsWithLofts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/reservations:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST method removed - now handled by Server Actions
// This API route now focuses only on data fetching operations