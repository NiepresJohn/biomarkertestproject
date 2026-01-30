'use client';

import { useState, useMemo } from 'react';
import { Biomarker } from '@/src/types/biomarker';
import { getColorValue } from '@/src/lib/biomarkerUtils';
import { BookingModal } from './BookingModal';
import { getSuggestedAppointmentDate } from '@/src/config/appointments';

// --- Chart anatomy: y-axis (same height as plot) | plot area ---
const Y_AXIS_WIDTH = 100;
const PLOT_HEIGHT = 280;
const GAP = 3;

// Fixed segment heights: 15% / 15% / 55% / 15% (top / in-range / optimal / bottom). Design constant.
const SEGMENT_TOTAL = PLOT_HEIGHT - GAP * 3; // 271
const H_TOP = Math.round(SEGMENT_TOTAL * 0.15);     // ≥100 Out of range
const H_IN = Math.round(SEGMENT_TOTAL * 0.15);      // 100 In range
const H_OPTIMAL = Math.round(SEGMENT_TOTAL * 0.55); // 75 Optimal (tallest)
const H_BOTTOM = SEGMENT_TOTAL - H_TOP - H_IN - H_OPTIMAL; // 0.00 Out of range

const PILL_WIDTH = 6;
const X_AXIS_ROW_HEIGHT = 56;

const LATEST_X_PERCENT = 32;
const FUTURE_X_PERCENT = 78;

const MARKER_DOT_SIZE = 10;
const MARKER_HALO_SIZE = 22;
const DASHED_LINE_WIDTH = 2;
const DASH_SEGMENT = 6;
const DASH_GAP = 4;

type Category = 'out-high' | 'in-range' | 'optimal' | 'out-low';

// Band positions (y from top). Order top→bottom: top band, in-range, optimal, bottom band.
const BAND_TOP_TOP = 0;
const BAND_TOP_HEIGHT = H_TOP;
const BAND_IN_TOP = H_TOP + GAP;
const BAND_IN_HEIGHT = H_IN;
const BAND_OPTIMAL_TOP = H_TOP + GAP + H_IN + GAP;
const BAND_OPTIMAL_HEIGHT = H_OPTIMAL;
const BAND_BOTTOM_TOP = H_TOP + GAP + H_IN + GAP + H_OPTIMAL + GAP;
const BAND_BOTTOM_HEIGHT = H_BOTTOM;

/**
 * Status: Optimal = green (e.g. 75 <= value < 100), In range = orange (e.g. 100), Out of range = red (high or low).
 * 78 with optimal 75–100 → Optimal (green).
 */
function getCategory(
  value: number,
  ranges: Biomarker['ranges']
): Category {
  const optimalRange = ranges.find(r => r.color === 'green');
  const inRange = ranges.find(r => r.color === 'orange');

  // Optimal: min <= value < max (so 78 in [75, 100) → optimal)
  if (
    optimalRange &&
    optimalRange.min != null &&
    optimalRange.max != null &&
    value >= optimalRange.min &&
    value < optimalRange.max
  ) {
    return 'optimal';
  }
  // In range: value in orange band (e.g. exactly 100 or narrow window)
  if (
    inRange &&
    inRange.min != null &&
    inRange.max != null &&
    value >= inRange.min &&
    value <= inRange.max
  ) {
    return 'in-range';
  }
  // Out of range high: above optimal max
  if (optimalRange?.max != null && value >= optimalRange.max) return 'out-high';
  if (inRange?.max != null && value > inRange.max) return 'out-high';
  // Out of range low
  return 'out-low';
}

/** Metabolic Health Score: hard override so we never show ≥60; use reference thresholds for labels only. */
const MHS_LABEL_FALLBACK = ['≥ 100', '100', '75', '0.00'] as const;

function isMetabolicHealthScore(name: string): boolean {
  return name.toLowerCase().includes('metabolic health score');
}

/**
 * Y-axis rows: order TOP→BOTTOM = ≥100 red, 100 orange, 75 green, 0.00 red (so bottom→top = 0.00, 75, 100, ≥100).
 * Fixed heights: 15% / 15% / 55% / 15%.
 * For Metabolic Health Score only: if CSV is wrong/missing, use MHS_LABEL_FALLBACK so we never show ≥60.
 */
function getYAxisRows(biomarker: Biomarker) {
  const { name, ranges } = biomarker;
  const optimalRange = ranges.find(r => r.color === 'green');
  const inRange = ranges.find(r => r.color === 'orange');
  const redRanges = ranges.filter(r => r.color === 'red').sort((a, b) => (b.order - a.order));
  const topRed = redRanges[0];
  const bottomRed = redRanges[redRanges.length - 1] ?? redRanges[0];

  const firstLineFromRanges = (role: 'top' | 'bottom' | 'in' | 'opt'): string => {
    if (role === 'top') return topRed?.max != null ? `≥ ${topRed.max}` : '≥ 100';
    if (role === 'bottom') return bottomRed?.min != null ? String(bottomRed.min) : '0.00';
    if (role === 'in') return inRange?.max != null ? String(inRange.max) : '100';
    if (role === 'opt') return optimalRange?.min != null ? String(optimalRange.min) : '75';
    return '75';
  };

  // Metabolic Health Score: never show ≥60; use reference labels exactly (0.00, 75, 100, ≥ 100)
  const useMhsFallback = isMetabolicHealthScore(name);
  const finalTop = useMhsFallback ? MHS_LABEL_FALLBACK[0] : firstLineFromRanges('top');
  const finalIn = useMhsFallback ? MHS_LABEL_FALLBACK[1] : firstLineFromRanges('in');
  const finalOpt = useMhsFallback ? MHS_LABEL_FALLBACK[2] : firstLineFromRanges('opt');
  const finalBottom = useMhsFallback ? MHS_LABEL_FALLBACK[3] : firstLineFromRanges('bottom');

  return [
    { color: 'red' as const, label: 'Out of range', firstLine: finalTop, height: H_TOP },
    { color: 'orange' as const, label: 'In range', firstLine: finalIn, height: H_IN },
    { color: 'green' as const, label: 'Optimal', firstLine: finalOpt, height: H_OPTIMAL },
    { color: 'red' as const, label: 'Out of range', firstLine: finalBottom, height: H_BOTTOM },
  ];
}

/**
 * Value → pixel y (0 = top of plot). Uses fixed band heights and range thresholds.
 * 78 in optimal 75–100 → tWithin = (78-75)/25 = 0.12 → y = bandTopY + 0.12 * hOptimal.
 */
function valueToY(value: number, ranges: Biomarker['ranges']): number {
  const optimalRange = ranges.find(r => r.color === 'green');
  const inRange = ranges.find(r => r.color === 'orange');

  const optMin = optimalRange?.min ?? 75;
  const optMax = optimalRange?.max ?? 100;
  const inMin = inRange?.min ?? 100;
  const inMax = inRange?.max ?? 100;

  // Bottom out-of-range: value < optMin → place in bottom band (middle)
  if (value < optMin) {
    return BAND_BOTTOM_TOP + BAND_BOTTOM_HEIGHT / 2;
  }

  // Optimal: optMin <= value < optMax
  if (value >= optMin && value < optMax) {
    const tWithin = (value - optMin) / (optMax - optMin);
    return BAND_OPTIMAL_TOP + tWithin * BAND_OPTIMAL_HEIGHT;
  }

  // In range: value ≈ 100 (or in orange band)
  if (value >= inMin && value <= inMax) {
    return BAND_IN_TOP + BAND_IN_HEIGHT / 2;
  }

  // Top out-of-range: value > optMax (or > inRange max) → place in top band (middle)
  return BAND_TOP_TOP + BAND_TOP_HEIGHT / 2;
}

/** Faint tint for active band only (by status). */
function activeBandTint(cat: Category): string {
  switch (cat) {
    case 'optimal':
      return 'rgba(34, 197, 94, 0.12)';
    case 'in-range':
      return 'rgba(251, 146, 60, 0.12)';
    case 'out-high':
    case 'out-low':
      return 'rgba(239, 68, 68, 0.12)';
  }
}

/** Pixel bounds for the active band (for highlight overlay). */
function getActiveBandBounds(category: Category): { top: number; height: number } {
  switch (category) {
    case 'out-high':
      return { top: BAND_TOP_TOP, height: BAND_TOP_HEIGHT };
    case 'in-range':
      return { top: BAND_IN_TOP, height: BAND_IN_HEIGHT };
    case 'optimal':
      return { top: BAND_OPTIMAL_TOP, height: BAND_OPTIMAL_HEIGHT };
    case 'out-low':
      return { top: BAND_BOTTOM_TOP, height: BAND_BOTTOM_HEIGHT };
  }
}

interface ModalChartContentProps {
  biomarker: Biomarker;
}

export function ModalChartContent({ biomarker }: ModalChartContentProps) {
  const [futureHover, setFutureHover] = useState(false);
  const [latestHover, setLatestHover] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { currentValue, ranges, unit, date } = biomarker;

  const category = useMemo(
    () => getCategory(currentValue, ranges),
    [currentValue, ranges]
  );
  const yAxisRows = useMemo(() => getYAxisRows(biomarker), [biomarker]);

  const latestDate = new Date(date);
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const chartY = valueToY(currentValue, ranges);
  const markerColor = getColorValue(
    category === 'optimal' ? 'green' : category === 'in-range' ? 'orange' : 'red'
  );
  const haloColor =
    category === 'optimal'
      ? 'rgba(16, 185, 129, 0.35)'
      : category === 'in-range'
        ? 'rgba(245, 158, 11, 0.35)'
        : 'rgba(239, 68, 68, 0.35)';

  const activeBand = getActiveBandBounds(category);

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
      {/* Row 1 Col 1: Y-axis scale — order top→bottom: ≥100 red, 100 orange, 75 green, 0.00 red */}
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

      {/* Row 1 Col 2: Plot area */}
      <div
        className="relative min-w-0"
        style={{
          height: PLOT_HEIGHT,
          gridRow: 1,
          gridColumn: 2,
        }}
      >
        {/* Plot bands — align with y-axis (10/70/10/10). No default tint; only active band gets tint. */}
        <div
          className="absolute left-0 right-0 top-0 rounded-sm pointer-events-none"
          style={{ height: BAND_TOP_HEIGHT, backgroundColor: 'transparent' }}
        />
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-sm"
          style={{ top: BAND_IN_TOP, height: BAND_IN_HEIGHT, backgroundColor: 'transparent' }}
        />
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-sm"
          style={{ top: BAND_OPTIMAL_TOP, height: BAND_OPTIMAL_HEIGHT, backgroundColor: 'transparent' }}
        />
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-sm"
          style={{ top: BAND_BOTTOM_TOP, height: BAND_BOTTOM_HEIGHT, backgroundColor: 'transparent' }}
        />

        {/* Active band highlight only (faint tint by status) */}
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-sm"
          style={{
            top: activeBand.top,
            height: activeBand.height,
            backgroundColor: activeBandTint(category),
          }}
        />

        {/* Baseline */}
        <div
          className="absolute left-0 right-0 h-px bg-gray-200 pointer-events-none"
          style={{ top: PLOT_HEIGHT }}
        />

        {/* Dashed line — color matches status (green when optimal) */}
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

        {/* Latest result marker — tooltip only on hover */}
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

        {/* Future marker (2026) — same y as latest */}
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
