/**
 * Utilities for profile-based biomarker range selection
 */

import type { ReferenceRange, RangeBand, BiomarkerStatus } from '@/src/types/biomarker';

/**
 * Calculate age group from age
 */
export function calculateAgeGroup(age: number): '18-39' | '40-59' | '60+' {
  if (age >= 18 && age <= 39) return '18-39';
  if (age >= 40 && age <= 59) return '40-59';
  if (age >= 60) return '60+';
  throw new Error(`Invalid age: ${age}. Must be 18 or older.`);
}

/**
 * Parse out-of-range rule string to extract numeric threshold
 * Examples: "<60" → 60, ">50" → 50, "≥75" → 75
 */
function parseOutOfRangeRule(rule: string): number | null {
  if (!rule) return null;

  const trimmed = rule.trim();

  // Handle < operator
  if (trimmed.startsWith('<')) {
    return parseFloat(trimmed.substring(1));
  }

  // Handle > operator
  if (trimmed.startsWith('>')) {
    return parseFloat(trimmed.substring(1));
  }

  // Handle ≥ operator
  if (trimmed.startsWith('≥')) {
    return parseFloat(trimmed.substring(1));
  }

  // Handle ≤ operator
  if (trimmed.startsWith('≤')) {
    return parseFloat(trimmed.substring(1));
  }

  return null;
}

/**
 * Convert ReferenceRange from database to RangeBand[] for UI
 * Handles both MHS (has optimal + in-range) and Creatinine (has optimal only)
 */
export function convertReferenceRangeToRangeBands(refRange: ReferenceRange): RangeBand[] {
  const bands: RangeBand[] = [];

  // Check what bands this biomarker has
  const hasOptimal = refRange.optimal_low !== null && refRange.optimal_high !== null;
  const hasInRange = refRange.inrange_low !== null && refRange.inrange_high !== null;

  // Add out-of-range low band (e.g., "<60" or "<0.7")
  if (refRange.outofrange_low_rule) {
    const max = parseOutOfRangeRule(refRange.outofrange_low_rule);
    bands.push({
      label: 'Out of range',
      min: null,
      max,
      color: 'red',
      order: 1,
    });
  }

  // Add in-range band if exists (MHS: orange "In range" between optimal and out-of-range)
  if (hasInRange) {
    bands.push({
      label: 'In range',
      min: refRange.inrange_low,
      max: refRange.inrange_high,
      color: 'orange',
      order: 2,
    });
  }

  // Add optimal band if exists (green - both MHS and Creatinine have this)
  if (hasOptimal) {
    bands.push({
      label: 'Optimal',
      min: refRange.optimal_low,
      max: refRange.optimal_high,
      color: 'green',
      order: hasInRange ? 3 : 2, // Order 3 if there's an in-range band, otherwise 2
    });
  }

  // Add out-of-range high band (e.g., ">1.2")
  if (refRange.outofrange_high_rule) {
    const min = parseOutOfRangeRule(refRange.outofrange_high_rule);
    bands.push({
      label: 'Out of range',
      min,
      max: null,
      color: 'red',
      order: hasInRange ? 4 : 3, // Adjust order based on whether in-range exists
    });
  }

  return bands;
}

/**
 * Calculate biomarker status from value and range bands
 */
export function calculateStatusFromBands(value: number, bands: RangeBand[]): BiomarkerStatus {
  // Check each band to see if value falls within it
  for (const band of bands) {
    const inRange =
      (band.min === null || value >= band.min) &&
      (band.max === null || value <= band.max);

    if (inRange) {
      // Map band label to status
      if (band.label === 'Optimal') return 'optimal';
      if (band.label === 'In range' || band.label === 'Normal') return 'in-range';
      if (band.label === 'Out of range') return 'out-of-range';
    }
  }

  // Default to out-of-range if no band matches
  return 'out-of-range';
}

/**
 * Format reference range as display string
 * For biomarkers without optimal (like Creatinine), show the normal/in-range
 */
export function formatReferenceRange(refRange: ReferenceRange): string {
  const hasOptimal = refRange.optimal_low !== null && refRange.optimal_high !== null;

  // For biomarkers with optimal range, show optimal
  if (hasOptimal) {
    return `${refRange.optimal_low} - ${refRange.optimal_high}`;
  }

  // For biomarkers without optimal (like Creatinine), show normal/in-range
  if (refRange.inrange_low !== null && refRange.inrange_high !== null) {
    return `${refRange.inrange_low} - ${refRange.inrange_high}`;
  }

  // Fallback to out-of-range rules
  if (refRange.outofrange_low_rule) {
    return `${refRange.outofrange_low_rule}`;
  }

  return 'N/A';
}
