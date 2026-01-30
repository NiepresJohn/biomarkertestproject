import Papa from 'papaparse';
import { Biomarker, RangeBand, CSVRow } from '@/src/types/biomarker';
import {
  parseRange,
  getRangeLabel,
  getRangeColor,
  calculateStatus,
  formatReferenceRange,
} from './biomarkerUtils';

/**
 * Parse CSV content and extract biomarker data
 * @param csvContent - Raw CSV file content
 * @param demographic - Demographic prefix to use (e.g., "Male_18-39")
 * @returns Array of parsed Biomarker objects
 */
export function parseCSVData(csvContent: string, demographic: string = 'Male_18-39'): Biomarker[] {
  const parsed = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: false,
  });

  const biomarkers: Biomarker[] = [];
  const rows = parsed.data;

  // Process rows to find biomarker definitions and values
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Skip empty rows
    if (!row.Biomarker_Name) continue;

    // Check if this is a value row (contains "Graph Value:")
    if (row.Biomarker_Name.includes('Graph Value:')) {
      // Extract value from the name field
      const match = row.Biomarker_Name.match(/Graph Value:\s*([\d.]+)/);
      if (match) {
        const value = parseFloat(match[1]);
        const biomarkerName = row.Biomarker_Name.split('Graph Value:')[0].trim();

        // Find the corresponding definition row (should be a few rows above)
        for (let j = i - 1; j >= 0 && j > i - 5; j--) {
          const defRow = rows[j];
          if (defRow.Biomarker_Name === biomarkerName) {
            const biomarker = parseBiomarkerRow(defRow, value, demographic);
            if (biomarker) {
              biomarkers.push(biomarker);
            }
            break;
          }
        }
      }
    } else if (row.Unit) {
      // This is a definition row (has both name and unit)
      // Check if we already processed it (has a value)
      const hasValue = biomarkers.some(b => b.name === row.Biomarker_Name);
      if (!hasValue) {
        // We might need to add this later when we find the value
        // For now, we'll handle it when we encounter the value row
      }
    }
  }

  return biomarkers;
}

/**
 * Parse a single biomarker definition row
 */
function parseBiomarkerRow(
  row: CSVRow,
  value: number,
  demographic: string
): Biomarker | null {
  const name = row.Biomarker_Name;
  const unit = row.Unit;

  if (!name || !unit) return null;

  // Extract range columns for the specified demographic
  const optimalCol = `${demographic}_Optimal`;
  const inRangeCol = `${demographic}_InRange`;
  const outOfRangeCol = `${demographic}_OutOfRange`;

  const ranges: RangeBand[] = [];

  // Parse optimal range
  if (row[optimalCol]) {
    const { min, max } = parseRange(row[optimalCol]);
    if (min !== null || max !== null) {
      ranges.push({
        label: 'Optimal',
        min,
        max,
        color: 'green',
        order: 2,
      });
    }
  }

  // Parse in-range
  if (row[inRangeCol]) {
    const { min, max } = parseRange(row[inRangeCol]);
    if (min !== null || max !== null) {
      ranges.push({
        label: 'In range',
        min,
        max,
        color: 'orange',
        order: 3,
      });
    }
  }

  // Parse out-of-range
  // Out of range might be split into multiple bands (below and above)
  if (row[outOfRangeCol]) {
    const { min, max } = parseRange(row[outOfRangeCol]);
    if (min !== null || max !== null) {
      // Determine if this is upper or lower out-of-range
      const order = max !== null && min === null ? 1 : 4;
      ranges.push({
        label: 'Out of range',
        min,
        max,
        color: 'red',
        order,
      });
    }
  }

  // If we don't have ranges, we can't create a valid biomarker
  if (ranges.length === 0) return null;

  const status = calculateStatus(value, ranges);
  const referenceRange = formatReferenceRange(ranges);

  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    unit,
    currentValue: value,
    date: '2025-08-15', // Hardcoded for MVP as per plan
    ranges,
    status,
    referenceRange,
  };
}

/**
 * Get mock Creatinine data (since it's missing from CSV)
 */
export function getMockCreatinineBiomarker(): Biomarker {
  return {
    id: 'creatinine',
    name: 'Creatinine',
    unit: 'mg/dL',
    currentValue: 0.64,
    date: '2025-08-15',
    referenceRange: '0.7 - 1.2',
    ranges: [
      {
        label: 'Out of range',
        min: 1.3,
        max: null,
        color: 'red',
        order: 4,
      },
      {
        label: 'In range',
        min: 1.2,
        max: 1.3,
        color: 'orange',
        order: 3,
      },
      {
        label: 'Optimal',
        min: 0.7,
        max: 1.2,
        color: 'green',
        order: 2,
      },
      {
        label: 'Out of range',
        min: null,
        max: 0.7,
        color: 'red',
        order: 1,
      },
    ],
    status: 'out-of-range',
  };
}
