import { supabase } from './supabase';
import { Biomarker, RangeBand } from '@/src/types/biomarker';
import { calculateStatus } from './biomarkerUtils';

/**
 * Update a biomarker's current value
 * This will automatically recalculate status and update the date to today
 */
export async function updateBiomarkerValue(
  biomarkerId: string,
  newValue: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch the biomarker with its ranges
    const { data: biomarker, error: fetchError } = await supabase
      .from('biomarkers')
      .select('*, range_bands(*)')
      .eq('id', biomarkerId)
      .single();

    if (fetchError || !biomarker) {
      return { success: false, error: 'Biomarker not found' };
    }

    // Transform range bands
    const ranges: RangeBand[] = biomarker.range_bands.map((r: any) => ({
      label: r.label,
      min: r.min_value,
      max: r.max_value,
      color: r.color,
      order: r.display_order,
    }));

    // Calculate new status
    const newStatus = calculateStatus(newValue, ranges);

    // Update biomarker
    const { error: updateError } = await supabase
      .from('biomarkers')
      .update({
        current_value: newValue,
        status: newStatus,
        date: new Date().toISOString().split('T')[0], // Today's date
      })
      .eq('id', biomarkerId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Add to historical readings
    const { error: readingError } = await supabase
      .from('biomarker_readings')
      .insert([{
        biomarker_id: biomarkerId,
        value: newValue,
        date: new Date().toISOString().split('T')[0],
        status: newStatus,
      }]);

    if (readingError) {
      // Non-critical: historical reading failed but main update succeeded
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Add a new biomarker to the database
 */
export async function addBiomarker(
  biomarker: Omit<Biomarker, 'status' | 'referenceRange'>,
  ranges: Omit<RangeBand, 'order'>[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Calculate status
    const status = calculateStatus(biomarker.currentValue, ranges as RangeBand[]);

    // Calculate reference range
    const optimalRange = ranges.find(r => r.label.toLowerCase().includes('optimal'));
    const referenceRange = optimalRange
      ? `${optimalRange.min || ''} - ${optimalRange.max || ''}`
      : '';

    // Insert biomarker
    const { error: biomarkerError } = await supabase
      .from('biomarkers')
      .insert([{
        id: biomarker.id,
        name: biomarker.name,
        unit: biomarker.unit,
        current_value: biomarker.currentValue,
        date: biomarker.date,
        reference_range: referenceRange,
        status,
      }]);

    if (biomarkerError) {
      return { success: false, error: biomarkerError.message };
    }

    // Insert range bands
    const rangeBandsData = ranges.map((range, index) => ({
      biomarker_id: biomarker.id,
      label: range.label,
      min_value: range.min,
      max_value: range.max,
      color: range.color,
      display_order: index + 1,
    }));

    const { error: rangesError } = await supabase
      .from('range_bands')
      .insert(rangeBandsData);

    if (rangesError) {
      // Rollback biomarker insert
      await supabase.from('biomarkers').delete().eq('id', biomarker.id);
      return { success: false, error: rangesError.message };
    }

    // Add initial reading
    await supabase
      .from('biomarker_readings')
      .insert([{
        biomarker_id: biomarker.id,
        value: biomarker.currentValue,
        date: biomarker.date,
        status,
      }]);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete a biomarker (cascades to range_bands and readings)
 */
export async function deleteBiomarker(
  biomarkerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('biomarkers')
      .delete()
      .eq('id', biomarkerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get historical readings for a biomarker
 */
export async function getBiomarkerHistory(
  biomarkerId: string,
  limit: number = 10
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('biomarker_readings')
      .select('*')
      .eq('biomarker_id', biomarkerId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
