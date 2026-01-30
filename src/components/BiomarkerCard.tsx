'use client';

import { Biomarker } from '@/src/types/biomarker';
import { getColorValue } from '@/src/lib/biomarkerUtils';
import { MiniIndicator } from './MiniIndicator';

interface BiomarkerCardProps {
  biomarker: Biomarker;
  onClick: () => void;
}

export function BiomarkerCard({ biomarker, onClick }: BiomarkerCardProps) {
  const statusColor = getColorValue(
    biomarker.status === 'optimal' ? 'green' :
    biomarker.status === 'in-range' ? 'orange' :
    'red'
  );

  const statusText =
    biomarker.status === 'optimal' ? 'Optimal' :
    biomarker.status === 'in-range' ? 'In range' :
    'Out of range';

  return (
    <div
      onClick={onClick}
      className="w-full min-w-0 bg-white rounded-xl border border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-shadow p-3 sm:p-4 md:px-5 md:py-4"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Mobile: stack. Desktop: 5-column grid with equal gap (gap-x-6) and equal padding (px-3) per column */}
      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1.5fr)_1fr_1fr_1fr_1fr] sm:items-center sm:gap-x-6 sm:gap-y-0">
        {/* Column 1: Biomarker Name */}
        <div className="min-w-0 px-0 sm:px-3 text-sm font-medium text-gray-900 truncate sm:text-base">
          {biomarker.name}
        </div>

        {/* Column 2: Status */}
        <div className="flex items-center gap-2 min-w-0 sm:px-3">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor }}
            aria-hidden="true"
          />
          <span className="text-xs text-gray-500 whitespace-nowrap sm:text-sm">
            {statusText}
          </span>
        </div>

        {/* Column 3: Current Value */}
        <div className="text-gray-900 min-w-0 sm:px-3">
          <span className="text-sm font-semibold sm:text-base">
            {biomarker.currentValue}
          </span>
          {biomarker.unit && (
            <span className="text-xs text-gray-500 ml-1 sm:text-sm">
              {biomarker.unit}
            </span>
          )}
        </div>

        {/* Column 4: Reference Range */}
        <div className="text-xs text-gray-500 min-w-0 sm:px-3 sm:text-sm">
          {biomarker.referenceRange}
        </div>

        {/* Column 5: Mini Range Indicator */}
        <div className="flex justify-end min-w-0 sm:px-3">
          <MiniIndicator biomarker={biomarker} />
        </div>
      </div>
    </div>
  );
}
