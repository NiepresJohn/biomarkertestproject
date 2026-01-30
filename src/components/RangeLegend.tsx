'use client';

import { RangeBand } from '@/src/types/biomarker';
import { getColorValue } from '@/src/lib/biomarkerUtils';

interface RangeLegendProps {
  ranges: RangeBand[];
}

export function RangeLegend({ ranges }: RangeLegendProps) {
  // Sort ranges by order (highest to lowest for vertical display)
  const sortedRanges = [...ranges].sort((a, b) => b.order - a.order);

  // Calculate total height for proportional bar sizing
  const allValues = sortedRanges.flatMap(r => [r.min, r.max].filter(v => v !== null)) as number[];
  const totalMin = Math.min(...allValues);
  const totalMax = Math.max(...allValues);
  const totalSpan = totalMax - totalMin;

  return (
    <div className="flex gap-4 items-stretch" style={{ minWidth: '120px' }}>
      {/* Vertical bar stack */}
      <div className="flex flex-col gap-0.5 w-2">
        {sortedRanges.map((range, index) => {
          const rangeMin = range.min ?? totalMin;
          const rangeMax = range.max ?? totalMax;
          const rangeSpan = rangeMax - rangeMin;
          const heightPercent = (rangeSpan / totalSpan) * 100;

          // Determine rounding
          const isFirst = index === 0;
          const isLast = index === sortedRanges.length - 1;
          const roundedClass = isFirst && isLast
            ? 'rounded-full'
            : isFirst
            ? 'rounded-t-full'
            : isLast
            ? 'rounded-b-full'
            : '';

          return (
            <div
              key={index}
              className={roundedClass}
              style={{
                backgroundColor: getColorValue(range.color),
                height: `${heightPercent}%`,
                minHeight: '40px',
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex flex-col justify-between py-1">
        {sortedRanges.map((range, index) => {
          const displayValue = range.max !== null
            ? range.max === range.min
              ? `${range.max}`
              : index === 0 && range.max !== null
              ? `≥ ${range.max}`
              : `${range.max}`
            : range.min !== null
            ? `${range.min}`
            : '';

          const textColor = range.color === 'red'
            ? 'text-red-500'
            : range.color === 'orange'
            ? 'text-amber-500'
            : 'text-green-500';

          return (
            <div key={index} className="flex flex-col justify-center">
              <div className={`text-xs font-semibold ${textColor}`}>
                {displayValue}
              </div>
              <div className={`text-xs ${textColor}`}>
                {range.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
