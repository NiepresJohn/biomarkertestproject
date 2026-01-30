import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * POST /api/setup-database
 * Initializes the database with seed data
 * This endpoint can be called once to set up the database on Vercel
 */
export async function POST() {
  try {
    const errors: string[] = [];
    const successes: string[] = [];

    // 1. Create sample profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        full_name: 'John Doe',
        sex: 'male',
        birthdate: '1985-06-15',
        age: 38,
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, San Francisco, CA 94102',
      })
      .select()
      .single();

    if (profileError) {
      errors.push(`Profile creation failed: ${profileError.message}`);
    } else {
      successes.push('Profile created successfully');
    }

    // 2. Create reference ranges
    const referenceRanges = [
      // Creatinine - Male
      { biomarker_name: 'Creatinine', unit: 'mg/dL', sex: 'male', age_group: '18-39', optimal_low: 0.7, optimal_high: 1.0, inrange_low: 0.6, inrange_high: 1.2, outofrange_low_rule: '< 0.6', outofrange_high_rule: '> 1.2' },
      { biomarker_name: 'Creatinine', unit: 'mg/dL', sex: 'male', age_group: '40-59', optimal_low: 0.7, optimal_high: 1.1, inrange_low: 0.6, inrange_high: 1.3, outofrange_low_rule: '< 0.6', outofrange_high_rule: '> 1.3' },
      { biomarker_name: 'Creatinine', unit: 'mg/dL', sex: 'male', age_group: '60+', optimal_low: 0.8, optimal_high: 1.2, inrange_low: 0.7, inrange_high: 1.4, outofrange_low_rule: '< 0.7', outofrange_high_rule: '> 1.4' },
      // Creatinine - Female
      { biomarker_name: 'Creatinine', unit: 'mg/dL', sex: 'female', age_group: '18-39', optimal_low: 0.5, optimal_high: 0.9, inrange_low: 0.5, inrange_high: 1.0, outofrange_low_rule: '< 0.5', outofrange_high_rule: '> 1.0' },
      { biomarker_name: 'Creatinine', unit: 'mg/dL', sex: 'female', age_group: '40-59', optimal_low: 0.6, optimal_high: 1.0, inrange_low: 0.5, inrange_high: 1.1, outofrange_low_rule: '< 0.5', outofrange_high_rule: '> 1.1' },
      { biomarker_name: 'Creatinine', unit: 'mg/dL', sex: 'female', age_group: '60+', optimal_low: 0.6, optimal_high: 1.1, inrange_low: 0.5, inrange_high: 1.2, outofrange_low_rule: '< 0.5', outofrange_high_rule: '> 1.2' },
      // Total Cholesterol - All
      { biomarker_name: 'Total Cholesterol', unit: 'mg/dL', sex: 'male', age_group: '18-39', optimal_low: 125, optimal_high: 170, inrange_low: 120, inrange_high: 200, outofrange_low_rule: '< 120', outofrange_high_rule: '> 200' },
      { biomarker_name: 'Total Cholesterol', unit: 'mg/dL', sex: 'male', age_group: '40-59', optimal_low: 125, optimal_high: 170, inrange_low: 120, inrange_high: 200, outofrange_low_rule: '< 120', outofrange_high_rule: '> 200' },
      { biomarker_name: 'Total Cholesterol', unit: 'mg/dL', sex: 'male', age_group: '60+', optimal_low: 125, optimal_high: 170, inrange_low: 120, inrange_high: 200, outofrange_low_rule: '< 120', outofrange_high_rule: '> 200' },
      { biomarker_name: 'Total Cholesterol', unit: 'mg/dL', sex: 'female', age_group: '18-39', optimal_low: 125, optimal_high: 170, inrange_low: 120, inrange_high: 200, outofrange_low_rule: '< 120', outofrange_high_rule: '> 200' },
      { biomarker_name: 'Total Cholesterol', unit: 'mg/dL', sex: 'female', age_group: '40-59', optimal_low: 125, optimal_high: 170, inrange_low: 120, inrange_high: 200, outofrange_low_rule: '< 120', outofrange_high_rule: '> 200' },
      { biomarker_name: 'Total Cholesterol', unit: 'mg/dL', sex: 'female', age_group: '60+', optimal_low: 125, optimal_high: 170, inrange_low: 120, inrange_high: 200, outofrange_low_rule: '< 120', outofrange_high_rule: '> 200' },
      // Fasting Glucose - All
      { biomarker_name: 'Fasting Glucose', unit: 'mg/dL', sex: 'male', age_group: '18-39', optimal_low: 70, optimal_high: 85, inrange_low: 65, inrange_high: 99, outofrange_low_rule: '< 65', outofrange_high_rule: '> 99' },
      { biomarker_name: 'Fasting Glucose', unit: 'mg/dL', sex: 'male', age_group: '40-59', optimal_low: 70, optimal_high: 85, inrange_low: 65, inrange_high: 99, outofrange_low_rule: '< 65', outofrange_high_rule: '> 99' },
      { biomarker_name: 'Fasting Glucose', unit: 'mg/dL', sex: 'male', age_group: '60+', optimal_low: 70, optimal_high: 85, inrange_low: 65, inrange_high: 99, outofrange_low_rule: '< 65', outofrange_high_rule: '> 99' },
      { biomarker_name: 'Fasting Glucose', unit: 'mg/dL', sex: 'female', age_group: '18-39', optimal_low: 70, optimal_high: 85, inrange_low: 65, inrange_high: 99, outofrange_low_rule: '< 65', outofrange_high_rule: '> 99' },
      { biomarker_name: 'Fasting Glucose', unit: 'mg/dL', sex: 'female', age_group: '40-59', optimal_low: 70, optimal_high: 85, inrange_low: 65, inrange_high: 99, outofrange_low_rule: '< 65', outofrange_high_rule: '> 99' },
      { biomarker_name: 'Fasting Glucose', unit: 'mg/dL', sex: 'female', age_group: '60+', optimal_low: 70, optimal_high: 85, inrange_low: 65, inrange_high: 99, outofrange_low_rule: '< 65', outofrange_high_rule: '> 99' },
    ];

    const { error: rangesError } = await supabase
      .from('reference_ranges')
      .upsert(referenceRanges, {
        onConflict: 'biomarker_name,sex,age_group',
        ignoreDuplicates: false,
      });

    if (rangesError) {
      errors.push(`Reference ranges creation failed: ${rangesError.message}`);
    } else {
      successes.push(`Created ${referenceRanges.length} reference ranges`);
    }

    // 3. Create biomarker results
    if (profile) {
      const biomarkerResults = [
        { profile_id: profile.id, biomarker_name: 'Creatinine', value: 0.9, unit: 'mg/dL', measured_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { profile_id: profile.id, biomarker_name: 'Total Cholesterol', value: 185, unit: 'mg/dL', measured_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { profile_id: profile.id, biomarker_name: 'Fasting Glucose', value: 92, unit: 'mg/dL', measured_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      const { error: resultsError } = await supabase
        .from('biomarker_results')
        .upsert(biomarkerResults, { ignoreDuplicates: true });

      if (resultsError) {
        errors.push(`Biomarker results creation failed: ${resultsError.message}`);
      } else {
        successes.push('Created biomarker results');
      }

      // 4. Create sample appointments
      const appointments = [
        { profile_id: profile.id, appointment_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'booked', source: 'schedule_page', notes: 'Routine checkup' },
        { profile_id: profile.id, appointment_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', source: 'schedule_page', notes: 'Annual physical' },
      ];

      const { error: appointmentsError } = await supabase
        .from('appointments')
        .upsert(appointments, { ignoreDuplicates: true });

      if (appointmentsError) {
        errors.push(`Appointments creation failed: ${appointmentsError.message}`);
      } else {
        successes.push('Created sample appointments');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          errors,
          successes,
          message: 'Database setup completed with some errors',
        },
        { status: 207 }
      );
    }

    return NextResponse.json({
      success: true,
      successes,
      message: 'Database setup completed successfully',
    });
  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup-database
 * Check if database is set up
 */
export async function GET() {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();

    const { data: ranges, error: rangesError } = await supabase
      .from('reference_ranges')
      .select('count');

    const { data: results, error: resultsError } = await supabase
      .from('biomarker_results')
      .select('count');

    return NextResponse.json({
      setup: {
        hasProfile: !profileError && profile !== null,
        hasReferenceRanges: !rangesError && ranges !== null,
        hasBiomarkerResults: !resultsError && results !== null,
      },
      errors: {
        profileError: profileError?.message,
        rangesError: rangesError?.message,
        resultsError: resultsError?.message,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
