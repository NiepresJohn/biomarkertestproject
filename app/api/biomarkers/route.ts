import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addBiomarker } from '@/src/lib/biomarkerOperations';
import {
  calculateAgeGroup,
  convertReferenceRangeToRangeBands,
  calculateStatusFromBands,
  formatReferenceRange,
} from '@/src/lib/rangeSelection';
import type { Biomarker, Profile, ReferenceRange, BiomarkerResult } from '@/src/types/biomarker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/biomarkers
 * Fetches biomarkers with profile-based range selection
 */
export async function GET() {
  try {
    // Step 1: Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'No profile found. Please run the seed script first.' },
        { status: 404 }
      );
    }

    // Step 2: Calculate age group
    const ageGroup = calculateAgeGroup(profile.age);

    // Step 3: Fetch biomarker results for this profile
    const { data: results, error: resultsError } = await supabase
      .from('biomarker_results')
      .select('*')
      .eq('profile_id', profile.id);

    if (resultsError) {
      console.error('Error fetching biomarker results:', resultsError);
      return NextResponse.json(
        { error: 'Failed to fetch biomarker results' },
        { status: 500 }
      );
    }

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'No biomarker results found for this profile' },
        { status: 404 }
      );
    }

    // Step 4: For each result, fetch matching reference range and convert to Biomarker format
    const biomarkers: Biomarker[] = [];
    const debugInfo: any[] = [];

    for (const result of results) {
      // Fetch matching reference range
      const { data: refRange, error: rangeError } = await supabase
        .from('reference_ranges')
        .select('*')
        .eq('biomarker_name', result.biomarker_name)
        .eq('sex', profile.sex)
        .eq('age_group', ageGroup)
        .single();

      if (rangeError || !refRange) {
        console.error(`No reference range found for ${result.biomarker_name} (${profile.sex}, ${ageGroup})`);
        continue;
      }

      // Convert reference range to RangeBand[]
      const ranges = convertReferenceRangeToRangeBands(refRange);

      // Calculate status
      const status = calculateStatusFromBands(result.value, ranges);

      // Format reference range string
      const referenceRange = formatReferenceRange(refRange);

      // Create Biomarker object
      const biomarker: Biomarker = {
        id: result.id,
        name: result.biomarker_name,
        unit: result.unit,
        currentValue: result.value,
        date: result.measured_at,
        ranges,
        status,
        referenceRange,
      };

      // Set custom graph domain for Creatinine (from CSV reference data)
      if (result.biomarker_name.toLowerCase().includes('creatinine')) {
        biomarker.graphMin = 0.1;
        biomarker.graphMax = 5.0;
      }

      biomarkers.push(biomarker);

      // Debug info
      debugInfo.push({
        biomarker_name: result.biomarker_name,
        user_sex: profile.sex,
        user_age: profile.age,
        age_group: ageGroup,
        selected_range: {
          optimal: refRange.optimal_low !== null && refRange.optimal_high !== null
            ? `${refRange.optimal_low}-${refRange.optimal_high}`
            : null,
          inrange: refRange.inrange_low !== null && refRange.inrange_high !== null
            ? `${refRange.inrange_low}-${refRange.inrange_high}`
            : null,
          outofrange_low: refRange.outofrange_low_rule,
          outofrange_high: refRange.outofrange_high_rule,
        },
        value: result.value,
        computed_status: status,
      });
    }

    // Return biomarkers with optional debug info
    return NextResponse.json({
      biomarkers,
      debug: debugInfo,
    });
  } catch (error) {
    console.error('Error loading biomarkers:', error);
    return NextResponse.json(
      { error: 'Failed to load biomarkers' },
      { status: 500 }
    );
  }
}

// POST endpoint to add new biomarkers (legacy - kept for backward compatibility)
export async function POST(request: Request) {
  try {
    const { biomarker, ranges } = await request.json();

    if (!biomarker || !ranges || !Array.isArray(ranges)) {
      return NextResponse.json(
        { error: 'Invalid request. Must include biomarker and ranges.' },
        { status: 400 }
      );
    }

    const result = await addBiomarker(biomarker, ranges);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Biomarker added successfully',
    });
  } catch (error: any) {
    console.error('Error saving biomarker:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
