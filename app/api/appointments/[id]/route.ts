import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Appointment, UpdateAppointmentInput } from '@/src/types/appointment';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// PATCH /api/appointments/[id] - Update appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = await params;
    const body = await request.json() as UpdateAppointmentInput;

    // Validate at least one field is provided
    const hasStatus = body.status !== undefined && body.status !== null;
    const hasNotes = body.notes !== undefined;

    if (!hasStatus && !hasNotes) {
      return NextResponse.json(
        { error: 'At least one field (status or notes) must be provided' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Partial<Appointment> = {};
    if (hasStatus) {
      updates.status = body.status;
    }
    if (hasNotes) {
      updates.notes = body.notes;
    }

    console.log('Updating appointment:', { id, updates });

    // Update appointment
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating appointment:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      // Handle not found
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Appointment not found' },
          { status: 404 }
        );
      }

      // Handle permission errors
      if (error.code === '42501' || error.message?.includes('permission')) {
        return NextResponse.json(
          {
            error: 'Permission denied. Check Supabase RLS policies.',
            details: error.message
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update appointment', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully updated appointment:', data);
    return NextResponse.json(data as Appointment);
  } catch (error) {
    console.error('Unexpected error in PATCH /api/appointments/[id]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
