import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/appointments/highlighted-days - Get days with appointments for a month
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);

    // Query parameters
    const profileId = searchParams.get('profile_id');
    const month = searchParams.get('month'); // Format: YYYY-MM

    if (!profileId || !month) {
      return NextResponse.json(
        { error: 'Missing required parameters: profile_id, month' },
        { status: 400 }
      );
    }

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Expected YYYY-MM' },
        { status: 400 }
      );
    }

    // Calculate start and end of month
    const [year, monthNum] = month.split('-').map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Fetch appointments for the month
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_at')
      .eq('profile_id', profileId)
      .eq('status', 'booked') // Only highlight booked appointments
      .gte('appointment_at', startOfMonth.toISOString())
      .lte('appointment_at', endOfMonth.toISOString());

    if (error) {
      console.error('Error fetching highlighted days:', error);
      return NextResponse.json(
        { error: 'Failed to fetch highlighted days', details: error.message },
        { status: 500 }
      );
    }

    // Extract unique day numbers
    const daySet = new Set<number>();
    if (data) {
      data.forEach((appointment) => {
        const date = new Date(appointment.appointment_at);
        daySet.add(date.getDate());
      });
    }

    const days = Array.from(daySet).sort((a, b) => a - b);

    return NextResponse.json({ days });
  } catch (error) {
    console.error('Unexpected error in GET /api/appointments/highlighted-days:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
