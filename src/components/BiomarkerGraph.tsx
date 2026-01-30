'use client';

import { Biomarker } from '@/src/types/biomarker';
import { ModalChartContent } from './ModalChartContent';
import { CreatinineChartContent } from './CreatinineChartContent';

interface BiomarkerGraphProps {
  biomarker: Biomarker;
}

function isCreatinine(name: string): boolean {
  return name.toLowerCase().includes('creatinine');
}

export function BiomarkerGraph({ biomarker }: BiomarkerGraphProps) {
  // Use specialized chart for Creatinine
  if (isCreatinine(biomarker.name)) {
    return <CreatinineChartContent biomarker={biomarker} />;
  }

  // Use default chart for other biomarkers
  return <ModalChartContent biomarker={biomarker} />;
}
