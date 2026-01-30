'use client';

import { useState } from 'react';
import { Biomarker } from '@/src/types/biomarker';
import { BiomarkerGraph } from '@/src/components/BiomarkerGraph';
import { Footer } from '@/src/components/Footer';

export default function TestGraphPage() {
  // Mock Creatinine biomarker data from screenshot
  const mockBiomarker: Biomarker = {
    id: 'creatinine',
    name: 'Creatinine',
    unit: 'mg/dL',
    currentValue: 0.64, // Out of range low value
    date: '2025-08-15',
    status: 'out-of-range',
    referenceRange: '0.7 - 1.2',
    ranges: [
      {
        label: 'Out of range',
        min: 0,
        max: 0.7,
        color: 'red',
        order: 1,
      },
      {
        label: 'Optimal',
        min: 0.7,
        max: 1.2,
        color: 'green',
        order: 2,
      },
      {
        label: 'In range',
        min: 1.2,
        max: 1.3,
        color: 'orange',
        order: 3,
      },
      {
        label: 'Out of range',
        min: 1.3,
        max: 1.5,
        color: 'red',
        order: 4,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Biomarker Graph Test Page
          </h1>
          <p className="text-gray-600">
            Testing the pixel-perfect biomarker graph implementation
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <BiomarkerGraph biomarker={mockBiomarker} />
        </div>

        <Footer />
      </div>
    </div>
  );
}
