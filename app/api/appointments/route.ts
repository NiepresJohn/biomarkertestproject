import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Appointment, CreateAppointmentInput } from '@/src/types/appointment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/appointments - Fetch appointments
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);

    // Query parameters
    const profileId = searchParams.get('profile_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');
    const date = searchParams.get('date'); // Specific date (YYYY-MM-DD)

    // Build query
    let query = supabase
      .from('appointments')
      .select('*')
      .order('appointment_at', { ascending: true });

    // Apply filters
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    if (date) {
      // Filter for specific date (start of day to end of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('appointment_at', startOfDay.toISOString())
        .lte('appointment_at', endOfDay.toISOString());
    } else {
      // Use date range if provided
      if (startDate) {
        query = query.gte('appointment_at', startDate);
      }
      if (endDate) {
        query = query.lte('appointment_at', endDate);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Appointment[]);
  } catch (error) {
    console.error('Unexpected error in GET /api/appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create appointment
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json() as CreateAppointmentInput;

    // Validate required fields
    if (!body.profile_id || !body.appointment_at || !body.source) {
      return NextResponse.json(
        { error: 'Missing required fields: profile_id, appointment_at, source' },
        { status: 400 }
      );
    }

    // Check for existing appointment at the same time (conflict detection)
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('profile_id', body.profile_id)
      .eq('appointment_at', body.appointment_at)
      .eq('status', 'booked'); // Only check booked appointments

    if (checkError) {
      console.error('Error checking for conflicts:', checkError);
      return NextResponse.json(
        { error: 'Failed to check appointment availability', details: checkError.message },
        { status: 500 }
      );
    }

    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 } // Conflict
      );
    }

    // Create appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        profile_id: body.profile_id,
        appointment_at: body.appointment_at,
        source: body.source,
        notes: body.notes || null,
        status: 'booked',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);

      // Handle unique constraint violation (fallback)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This time slot is already booked' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create appointment', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data as Appointment, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
