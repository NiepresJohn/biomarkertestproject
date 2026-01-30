import { RangeBand, BiomarkerStatus, RangeColor } from '@/src/types/biomarker';

/**
 * Parse a range string like "75-100", "<60", ">100", "≥100" into min/max values
 */
export function parseRange(rangeString: string): { min: number | null; max: number | null } {
  const trimmed = rangeString.trim();

  // Handle empty or invalid strings
  if (!trimmed || trimmed === '-') {
    return { min: null, max: null };
  }

  // Handle ranges like "75-100"
  if (trimmed.includes('-') && !trimmed.startsWith('<') && !trimmed.startsWith('>')) {
    const parts = trimmed.split('-').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { min: parts[0], max: parts[1] };
    }
  }

  // Handle "<60" - upper bound only
  if (trimmed.startsWith('<')) {
    const value = parseFloat(trimmed.substring(1).trim());
    if (!isNaN(value)) {
      return { min: null, max: value };
    }
  }

  // Handle ">100" or "≥100" - lower bound only
  if (trimmed.startsWith('>') || trimmed.startsWith('≥')) {
    const value = parseFloat(trimmed.substring(1).trim());
    if (!isNaN(value)) {
      return { min: value, max: null };
    }
  }

  // Try to parse as single number
  const singleValue = parseFloat(trimmed);
  if (!isNaN(singleValue)) {
    return { min: singleValue, max: singleValue };
  }

  return { min: null, max: null };
}

/**
 * Determine the status label for a range ("Optimal", "In range", "Out of range")
 */
export function getRangeLabel(columnName: string): string {
  const lower = columnName.toLowerCase();
  if (lower.includes('optimal')) return 'Optimal';
  if (lower.includes('inrange') || lower.includes('in_range')) return 'In range';
  if (lower.includes('outofrange') || lower.includes('out_of_range')) return 'Out of range';
  return 'Unknown';
}

/**
 * Determine the color for a range band based on its label
 */
export function getRangeColor(label: string): RangeColor {
  const lower = label.toLowerCase();
  if (lower.includes('optimal')) return 'green';
  if (lower.includes('in range')) return 'orange';
  if (lower.includes('out of range')) return 'red';
  return 'red'; // default to red for unknown
}

/**
 * Calculate the biomarker status based on current value and range bands
 */
export function calculateStatus(value: number, ranges: RangeBand[]): BiomarkerStatus {
  // Check each range band to see if value falls within it
  for (const range of ranges) {
    const { min, max } = range;

    // Check if value is within this range
    const aboveMin = min === null || value >= min;
    const belowMax = max === null || value <= max;

    if (aboveMin && belowMax) {
      // Value falls in this range, return status based on label
      const lower = range.label.toLowerCase();
      if (lower.includes('optimal')) return 'optimal';
      if (lower.includes('in range')) return 'in-range';
      if (lower.includes('out of range')) return 'out-of-range';
    }
  }

  // If no range matched, default to out-of-range
  return 'out-of-range';
}

/**
 * Format a reference range for display (e.g., "0.7 - 1.2")
 */
export function formatReferenceRange(ranges: RangeBand[]): string {
  // Find the optimal or in-range band for display
  const optimalRange = ranges.find(r => r.label.toLowerCase().includes('optimal'));
  const inRange = ranges.find(r => r.label.toLowerCase().includes('in range'));

  const displayRange = optimalRange || inRange;

  if (!displayRange) {
    return '';
  }

  const { min, max } = displayRange;

  if (min !== null && max !== null) {
    return `${min} - ${max}`;
  } else if (min !== null) {
    return `≥${min}`;
  } else if (max !== null) {
    return `<${max}`;
  }

  return '';
}

/**
 * Get CSS color value from RangeColor type
 */
export function getColorValue(color: RangeColor): string {
  switch (color) {
    case 'green':
      return '#10B981';
    case 'orange':
      return '#F59E0B';
    case 'red':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}
