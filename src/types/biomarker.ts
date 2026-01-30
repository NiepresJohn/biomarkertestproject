export type BiomarkerStatus = "optimal" | "in-range" | "out-of-range";
export type RangeColor = "green" | "orange" | "red";

export interface RangeBand {
  label: string; // "Optimal", "In range", "Out of range"
  min: number | null; // null for unbounded
  max: number | null; // null for unbounded
  color: RangeColor;
  order: number; // For vertical stacking (higher = top)
}

export interface Biomarker {
  id: string;
  name: string;
  unit: string;
  currentValue: number;
  date: string; // Latest result date
  ranges: RangeBand[];
  status: BiomarkerStatus;
  referenceRange: string; // Display string like "0.7 - 1.2"
  graphMin?: number; // Optional explicit graph domain minimum
  graphMax?: number; // Optional explicit graph domain maximum
}

export interface CSVRow {
  Biomarker_Name: string;
  Unit: string;
  [key: string]: string; // Demographic-specific range columns
}

// New types for profile-based range selection
export interface Profile {
  id: string;
  full_name: string;
  sex: 'male' | 'female';
  birthdate?: string;
  age: number;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface ReferenceRange {
  id: string;
  biomarker_name: string;
  unit: string;
  sex: 'male' | 'female';
  age_group: '18-39' | '40-59' | '60+';
  optimal_low: number | null;
  optimal_high: number | null;
  inrange_low: number | null;
  inrange_high: number | null;
  outofrange_low_rule: string | null;
  outofrange_high_rule: string | null;
  created_at: string;
}

export interface BiomarkerResult {
  id: string;
  profile_id: string;
  biomarker_name: string;
  value: number;
  unit: string;
  measured_at: string;
  created_at: string;
}
