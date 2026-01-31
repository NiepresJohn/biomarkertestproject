'use client';

import { useState, useMemo } from 'react';
import { Biomarker } from '@/src/types/biomarker';
import { getColorValue } from '@/src/lib/biomarkerUtils';
import { BookingModal } from './BookingModal';
import { getSuggestedAppointmentDate } from '@/src/config/appointments';

// Chart dimensions for Creatinine
const Y_AXIS_WIDTH = 100;
const PLOT_HEIGHT = 280;
const GAP = 3;

// Creatinine-specific band heights: 30% low / 40% normal / 30% high
const SEGMENT_TOTAL = PLOT_HEIGHT - GAP * 2; // 274
const H_HIGH = Math.round(SEGMENT_TOTAL * 0.30);     // Out of range (high) - top
const H_NORMAL = Math.round(SEGMENT_TOTAL * 0.40);   // Normal (in-range) - middle
const H_LOW = SEGMENT_TOTAL - H_HIGH - H_NORMAL;     // Out of range (low) - bottom

const PILL_WIDTH = 6;
const X_AXIS_ROW_HEIGHT = 56;

const LATEST_X_PERCENT = 32;
const FUTURE_X_PERCENT = 78;

const MARKER_DOT_SIZE = 10;
const MARKER_HALO_SIZE = 22;
const DASHED_LINE_WIDTH = 2;
const DASH_SEGMENT = 6;
const DASH_GAP = 4;

type CreatinineCategory = 'out-high' | 'optimal' | 'out-low';

// Band positions (y from top). Order: high (out), normal, low (out)
const BAND_HIGH_TOP = 0;
const BAND_HIGH_HEIGHT = H_HIGH;
const BAND_NORMAL_TOP = H_HIGH + GAP;
const BAND_NORMAL_HEIGHT = H_NORMAL;
const BAND_LOW_TOP = H_HIGH + GAP + H_NORMAL + GAP;
const BAND_LOW_HEIGHT = H_LOW;

/**
 * Determine creatinine category based on value and ranges
 * Optimal = green, Out of range = red (high or low)
 */
function getCreatinineCategory(
  value: number,
  ranges: Biomarker['ranges']
): CreatinineCategory {
  const optimalRange = ranges.find(r => r.color === 'green' && r.label === 'Optimal');

  if (!optimalRange || optimalRange.min == null || optimalRange.max == null) {
    return 'out-low'; // fallback
  }

  // Optimal range: min <= value <= max
  if (value >= optimalRange.min && value <= optimalRange.max) {
    return 'optimal';
  }

  // High: value > max
  if (value > optimalRange.max) {
    return 'out-high';
  }

  // Low: value < min
  return 'out-low';
}

/**
 * Y-axis labels for Creatinine
 * Domain: 0.1 - 5.0 mg/dL (from CSV reference data)
 * Three bands: High (>optimal), Optimal (0.75-1.0 male, 0.6-0.9 female), Low (<optimal)
 */
function getCreatinineYAxisRows(biomarker: Biomarker) {
  const { ranges } = biomarker;
  const optimalRange = ranges.find(r => r.color === 'green');
  const redRanges = ranges.filter(r => r.color === 'red').sort((a, b) => (b.order || 0) - (a.order || 0));

  const highThreshold = optimalRange?.max ?? 1.2;
  const lowThreshold = optimalRange?.min ?? 0.7;

  return [
    {
      color: 'red' as const,
      label: 'Out of range',
      firstLine: `> ${highThreshold}`,
      height: H_HIGH
    },
    {
      color: 'green' as const,
      label: 'Optimal',
      firstLine: `${lowThreshold}–${highThreshold}`,
      height: H_NORMAL
    },
    {
      color: 'red' as const,
      label: 'Out of range',
      firstLine: `< ${lowThreshold}`,
      height: H_LOW
    },
  ];
}

/**
 * Map value to Y position for Creatinine
 * Y-axis domain: 0.1 - 5.0 mg/dL (visual domain from CSV)
 * Actual ranges: Low <optimal, Optimal (0.75-1.0 male, 0.6-0.9 female), High >optimal
 */
function creatinineValueToY(value: number, ranges: Biomarker['ranges']): number {
  const optimalRange = ranges.find(r => r.color === 'green');
  const normalMin = optimalRange?.min ?? 0.75;
  const normalMax = optimalRange?.max ?? 1.0;

  // Visual domain for Y-axis (from CSV reference data)
  const DOMAIN_MIN = 0.1;
  const DOMAIN_MAX = 5.0;
  const DOMAIN_SPAN = DOMAIN_MAX - DOMAIN_MIN;

  // Calculate which band and position within that band
  if (value < normalMin) {
    // Low band: map 0.3 to normalMin across the low band
    const bandMin = DOMAIN_MIN;
    const bandMax = normalMin;
    const bandSpan = bandMax - bandMin;
    const t = Math.max(0, Math.min(1, (value - bandMin) / bandSpan));
    return BAND_LOW_TOP + (1 - t) * BAND_LOW_HEIGHT; // inverted because lower values are at bottom
  } else if (value <= normalMax) {
    // Normal band: map normalMin to normalMax
    const t = (value - normalMin) / (normalMax - normalMin);
    return BAND_NORMAL_TOP + (1 - t) * BAND_NORMAL_HEIGHT; // inverted
  } else {
    // High band: map normalMax to DOMAIN_MAX
    const bandMin = normalMax;
    const bandMax = DOMAIN_MAX;
    const bandSpan = bandMax - bandMin;
    const t = Math.max(0, Math.min(1, (value - bandMin) / bandSpan));
    return BAND_HIGH_TOP + (1 - t) * BAND_HIGH_HEIGHT; // inverted
  }
}

/** Faint tint for active band */
function activeBandTintCreatinine(cat: CreatinineCategory): string {
  switch (cat) {
    case 'optimal':
      return 'rgba(34, 197, 94, 0.12)'; // green
    case 'out-high':
    case 'out-low':
      return 'rgba(239, 68, 68, 0.12)'; // red
  }
}

/** Active band bounds for highlight */
function getCreatinineActiveBandBounds(category: CreatinineCategory): { top: number; height: number } {
  switch (category) {
    case 'out-high':
      return { top: BAND_HIGH_TOP, height: BAND_HIGH_HEIGHT };
    case 'optimal':
      return { top: BAND_NORMAL_TOP, height: BAND_NORMAL_HEIGHT };
    case 'out-low':
      return { top: BAND_LOW_TOP, height: BAND_LOW_HEIGHT };
  }
}

interface CreatinineChartContentProps {
  biomarker: Biomarker;
}

export function CreatinineChartContent({ biomarker }: CreatinineChartContentProps) {
  const [futureHover, setFutureHover] = useState(false);
  const [latestHover, setLatestHover] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { currentValue, ranges, unit, date } = biomarker;

  const category = useMemo(
    () => getCreatinineCategory(currentValue, ranges),
    [currentValue, ranges]
  );
  const yAxisRows = useMemo(() => getCreatinineYAxisRows(biomarker), [biomarker]);

  const latestDate = new Date(date);
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const chartY = creatinineValueToY(currentValue, ranges);
  const markerColor = getColorValue(category === 'optimal' ? 'green' : 'red');
  const haloColor = category === 'optimal'
    ? 'rgba(16, 185, 129, 0.35)'
    : 'rgba(239, 68, 68, 0.35)';

  const activeBand = getCreatinineActiveBandBounds(category);

  return (
    <div
      className="w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `${Y_AXIS_WIDTH}px 1fr`,
        gridTemplateRows: `${PLOT_HEIGHT}px ${X_AXIS_ROW_HEIGHT}px`,
        gap: 0,
      }}
    >
      {/* Y-axis scale */}
      <div
        className="flex flex-col shrink-0"
        style={{
          width: Y_AXIS_WIDTH,
          height: PLOT_HEIGHT,
          gridRow: 1,
          gridColumn: 1,
          gap: GAP,
        }}
      >
        {yAxisRows.map((row, i) => (
          <div
            key={i}
            className="flex items-stretch gap-3 flex-shrink-0"
            style={{ height: row.height }}
          >
            <div
              style={{
                width: PILL_WIDTH,
                flexShrink: 0,
                borderRadius: 9999,
                backgroundColor: getColorValue(row.color),
                height: '100%',
              }}
            />
            <div className="flex flex-col justify-center leading-tight py-0.5 min-w-0">
              <span className="text-xs font-medium" style={{ color: getColorValue(row.color) }}>
                {row.firstLine}
              </span>
              <span className="text-xs" style={{ color: getColorValue(row.color) }}>
                {row.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Plot area */}
      <div
        className="relative min-w-0"
        style={{
          height: PLOT_HEIGHT,
          gridRow: 1,
          gridColumn: 2,
        }}
      >
        {/* Plot bands - transparent by default */}
        <div
          className="absolute left-0 right-0 top-0 rounded-sm pointer-events-none"
          style={{ height: BAND_HIGH_HEIGHT, backgroundColor: 'transparent' }}
        />
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-sm"
          style={{ top: BAND_NORMAL_TOP, height: BAND_NORMAL_HEIGHT, backgroundColor: 'transparent' }}
        />
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-sm"
          style={{ top: BAND_LOW_TOP, height: BAND_LOW_HEIGHT, backgroundColor: 'transparent' }}
        />

        {/* Active band highlight */}
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-sm"
          style={{
            top: activeBand.top,
            height: activeBand.height,
            backgroundColor: activeBandTintCreatinine(category),
          }}
        />

        {/* Baseline */}
        <div
          className="absolute left-0 right-0 h-px bg-gray-200 pointer-events-none"
          style={{ top: PLOT_HEIGHT }}
        />

        {/* Dashed line - color matches status */}
        <svg
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: PLOT_HEIGHT,
          }}
        >
          <line
            x1={`${LATEST_X_PERCENT}%`}
            y1={0}
            x2={`${LATEST_X_PERCENT}%`}
            y2={PLOT_HEIGHT}
            stroke={markerColor}
            strokeWidth={DASHED_LINE_WIDTH}
            strokeDasharray={`${DASH_SEGMENT} ${DASH_GAP}`}
          />
        </svg>

        {/* Latest result marker */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-default"
          style={{
            left: `${LATEST_X_PERCENT}%`,
            top: chartY,
          }}
          onMouseEnter={() => setLatestHover(true)}
          onMouseLeave={() => setLatestHover(false)}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: MARKER_HALO_SIZE,
              height: MARKER_HALO_SIZE,
              left: -MARKER_HALO_SIZE / 2,
              top: -MARKER_HALO_SIZE / 2,
              backgroundColor: haloColor,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: MARKER_DOT_SIZE,
              height: MARKER_DOT_SIZE,
              left: -MARKER_DOT_SIZE / 2,
              top: -MARKER_DOT_SIZE / 2,
              backgroundColor: markerColor,
            }}
          />
        </div>

        {latestHover && (
          <div
            className="absolute z-10 transform -translate-x-1/2 pointer-events-none"
            style={{
              left: `${LATEST_X_PERCENT}%`,
              top: chartY - MARKER_HALO_SIZE / 2 - 32,
            }}
          >
            <div className="px-2.5 py-1.5 rounded-lg bg-white text-gray-800 text-xs font-medium whitespace-nowrap shadow-md border border-gray-100">
              {currentValue} {unit}
            </div>
          </div>
        )}

        {/* Future marker */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{
            left: `${FUTURE_X_PERCENT}%`,
            top: chartY,
          }}
          onMouseEnter={() => setFutureHover(true)}
          onMouseLeave={() => setFutureHover(false)}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: MARKER_HALO_SIZE,
              height: MARKER_HALO_SIZE,
              left: -MARKER_HALO_SIZE / 2,
              top: -MARKER_HALO_SIZE / 2,
              backgroundColor: 'rgba(156, 163, 175, 0.35)',
            }}
          />
          <div
            className="absolute rounded-full bg-gray-400"
            style={{
              width: MARKER_DOT_SIZE,
              height: MARKER_DOT_SIZE,
              left: -MARKER_DOT_SIZE / 2,
              top: -MARKER_DOT_SIZE / 2,
            }}
          />
        </div>

        {futureHover && (
          <div
            className="absolute z-10 rounded-xl bg-white shadow-xl border border-gray-200 p-4 min-w-[220px] max-w-[260px] transition-shadow duration-200"
            style={{
              left: `${FUTURE_X_PERCENT}%`,
              top: chartY - MARKER_HALO_SIZE / 2 - 100,
              transform: 'translate(-50%, 0)',
            }}
            onMouseEnter={() => setFutureHover(true)}
            onMouseLeave={() => setFutureHover(false)}
          >
            <p className="text-sm text-gray-600 mb-3 leading-snug break-words">
              Schedule your annual re-test
            </p>
            <button
              type="button"
              className="w-full py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium transition-all duration-200 hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => setIsBookingModalOpen(true)}
            >
              Book now
            </button>
          </div>
        )}
      </div>

      <div style={{ gridRow: 2, gridColumn: 1 }} />

      {/* X-axis labels */}
      <div
        className="relative flex items-start pt-2"
        style={{
          gridRow: 2,
          gridColumn: 2,
          height: X_AXIS_ROW_HEIGHT,
        }}
      >
        <div
          className="absolute flex flex-col items-center text-center"
          style={{
            left: `${LATEST_X_PERCENT}%`,
            top: 8,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            Latest result
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {formatDate(latestDate)}
          </span>
        </div>
        <div
          className="absolute text-center"
          style={{
            left: `${FUTURE_X_PERCENT}%`,
            top: 8,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">2026</span>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        source="biomarker_modal"
        preselectedDate={getSuggestedAppointmentDate(latestDate)}
      />
    </div>
  );
}
