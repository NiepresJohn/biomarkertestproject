import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/profile
 * Returns the current user profile
 * For MVP: Returns the first/sample profile in the database
 */
export async function GET() {
  try {
    // Fetch the first profile (sample user for MVP)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'No profile found. Please run the seed script.' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Updates the current user profile (phone and address only)
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { phone, address } = body;

    // Validate input
    if (!phone && !address) {
      return NextResponse.json(
        { error: 'At least one field (phone or address) must be provided' },
        { status: 400 }
      );
    }

    // Get the current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);

      // Check if it's a column not found error
      if (error.message?.includes('column') && (error.message?.includes('phone') || error.message?.includes('address'))) {
        return NextResponse.json(
          {
            error: 'Database columns not found. Please run the migration script.',
            details: error.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in profile PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
