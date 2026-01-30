import { createClient } from '@supabase/supabase-js';
import { Biomarker, RangeBand } from '@/src/types/biomarker';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all biomarkers with their range bands from Supabase
 */
export async function fetchBiomarkers(): Promise<Biomarker[]> {
  // Fetch biomarkers
  const { data: biomarkers, error: biomarkersError } = await supabase
    .from('biomarkers')
    .select('*')
    .order('name');

  if (biomarkersError) {
    throw new Error('Failed to fetch biomarkers');
  }

  if (!biomarkers || biomarkers.length === 0) {
    return [];
  }

  // Fetch range bands for all biomarkers
  const biomarkerIds = biomarkers.map((b: any) => b.id);
  const { data: rangeBands, error: rangesError } = await supabase
    .from('range_bands')
    .select('*')
    .in('biomarker_id', biomarkerIds)
    .order('display_order');

  if (rangesError) {
    throw new Error('Failed to fetch range bands');
  }

  // Transform database records to Biomarker type
  const result: Biomarker[] = biomarkers.map((b: any) => {
    const ranges: RangeBand[] = (rangeBands || [])
      .filter((r: any) => r.biomarker_id === b.id)
      .map((r: any) => ({
        label: r.label,
        min: r.min_value,
        max: r.max_value,
        color: r.color as 'green' | 'orange' | 'red',
        order: r.display_order,
      }));

    return {
      id: b.id,
      name: b.name,
      unit: b.unit,
      currentValue: parseFloat(b.current_value),
      date: b.date,
      ranges,
      status: b.status,
      referenceRange: b.reference_range,
    };
  });

  return result;
}

/**
 * Save or update a biomarker
 */
export async function saveBiomarker(biomarker: Biomarker) {
  const { data, error } = await supabase
    .from('biomarkers')
    .upsert([
      {
        id: biomarker.id,
        name: biomarker.name,
        unit: biomarker.unit,
        current_value: biomarker.currentValue,
        date: biomarker.date,
        reference_range: biomarker.referenceRange,
        status: biomarker.status,
      },
    ], { onConflict: 'id' });

  return { data, error };
}

/**
 * Fetch historical readings for a biomarker
 */
export async function fetchBiomarkerHistory(biomarkerId: string) {
  const { data, error } = await supabase
    .from('biomarker_readings')
    .select('*')
    .eq('biomarker_id', biomarkerId)
    .order('date', { ascending: false });

  return { data, error };
}
