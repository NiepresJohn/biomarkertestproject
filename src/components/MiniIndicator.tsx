'use client';

import { Biomarker } from '@/src/types/biomarker';
import { getColorValue } from '@/src/lib/biomarkerUtils';
import { useSearchParams } from 'next/navigation';

interface MiniIndicatorProps {
  biomarker: Biomarker;
}

// --- Layout: [ highlight (dot centered) ][ pills — no gap, connected ] ---
const PILL_WIDTH = 6;
const G = 3; // gap between pills
const H_RED = 7;
const H_ORANGE = 7;
const H_GREEN = 16; // green tallest; red/orange same small height

// Heights for 4-band layout (MHS): RED + ORANGE + GREEN + RED
const H_TOTAL_4BAND = H_RED + G + H_ORANGE + G + H_GREEN + G + H_RED; // 46

// Heights for 3-band layout (Creatinine): RED + GREEN + RED (no orange)
const H_TOTAL_3BAND = H_RED + G + H_GREEN + G + H_RED; // 36

const HIGHLIGHT_WIDTH = 62; // highlight + pills connected (no gap)
const CONTAINER_WIDTH = HIGHLIGHT_WIDTH + PILL_WIDTH; // 68
const CONTAINER_HEIGHT = 58;

const DOT_INNER_SIZE = 8;
const DOT_WHITE_RING = 2; // distinct white ring between dot and halo (reference)
const DOT_HALO_OUTER = 20; // outer diameter of halo (inner = dot + 2*ring)
const DOT_CENTER_X = HIGHLIGHT_WIDTH / 2; // center of rectangular highlight

// Segment vertical spans for 4-band layout (top = 0)
const TOP_RED_TOP_4BAND = 0;
const TOP_RED_BOTTOM_4BAND = H_RED;
const ORANGE_TOP_4BAND = H_RED + G;
const ORANGE_BOTTOM_4BAND = ORANGE_TOP_4BAND + H_ORANGE;
const GREEN_TOP_4BAND = ORANGE_BOTTOM_4BAND + G;
const GREEN_BOTTOM_4BAND = GREEN_TOP_4BAND + H_GREEN;
const BOTTOM_RED_TOP_4BAND = GREEN_BOTTOM_4BAND + G;
const BOTTOM_RED_BOTTOM_4BAND = H_TOTAL_4BAND;

// Segment vertical spans for 3-band layout (top = 0) - NO ORANGE
const TOP_RED_TOP_3BAND = 0;
const TOP_RED_BOTTOM_3BAND = H_RED;
const GREEN_TOP_3BAND = H_RED + G;
const GREEN_BOTTOM_3BAND = GREEN_TOP_3BAND + H_GREEN;
const BOTTOM_RED_TOP_3BAND = GREEN_BOTTOM_3BAND + G;
const BOTTOM_RED_BOTTOM_3BAND = H_TOTAL_3BAND;

type StatusZone = 'out-high' | 'in-range' | 'optimal' | 'out-low';

function deriveGraphDomain(biomarker: Biomarker): { graphMin: number; graphMax: number } {
  const { currentValue, ranges, graphMin: explicitMin, graphMax: explicitMax } = biomarker;
  if (explicitMin !== undefined && explicitMax !== undefined) {
    return { graphMin: explicitMin, graphMax: explicitMax };
  }
  const allBoundaries = ranges.flatMap(r => [r.min, r.max].filter(v => v !== null)) as number[];
  if (ranges.length > 1 && allBoundaries.length >= 2) {
    return { graphMin: Math.min(...allBoundaries), graphMax: Math.max(...allBoundaries) };
  }
  if (ranges.length === 1) {
    const onlyRange = ranges[0];
    const low = onlyRange.min ?? onlyRange.max ?? currentValue;
    const high = onlyRange.max ?? onlyRange.min ?? currentValue;
    const width = high - low;
    const padding = width !== 0 ? width * 0.25 : Math.max(1, Math.abs(high) * 0.25);
    return { graphMin: low - padding, graphMax: high + padding };
  }
  if (allBoundaries.length >= 2) {
    return { graphMin: Math.min(...allBoundaries), graphMax: Math.max(...allBoundaries) };
  }
  return { graphMin: currentValue - 1, graphMax: currentValue + 1 };
}

function getStatusZone(
  value: number,
  ranges: Biomarker['ranges'],
  graphMin: number,
  graphMax: number
): StatusZone {
  const optimalRange = ranges.find(r => r.color === 'green');
  const inRange = ranges.find(r => r.color === 'orange');
  if (
    optimalRange &&
    (optimalRange.min === null || value >= optimalRange.min) &&
    (optimalRange.max === null || value <= optimalRange.max)
  ) {
    return 'optimal';
  }
  if (
    inRange &&
    inRange.min !== null &&
    inRange.max !== null &&
    value >= inRange.min &&
    value <= inRange.max
  ) {
    return 'in-range';
  }
  const upperEdge = Math.max(
    graphMax,
    optimalRange?.max ?? -Infinity,
    inRange?.max ?? -Infinity
  );
  const lowerEdge = Math.min(
    graphMin,
    optimalRange?.min ?? Infinity,
    inRange?.min ?? Infinity
  );
  if (value > upperEdge) return 'out-high';
  if (value < lowerEdge) return 'out-low';
  return value >= (graphMin + graphMax) / 2 ? 'optimal' : 'out-low';
}

function getZoneSpan(zone: StatusZone, has3Bands: boolean): { top: number; bottom: number } {
  if (has3Bands) {
    // 3-band layout (Creatinine): RED / GREEN / RED
    switch (zone) {
      case 'out-high':
        return { top: TOP_RED_TOP_3BAND, bottom: TOP_RED_BOTTOM_3BAND };
      case 'in-range':
        // Should not happen for 3-band biomarkers, but fallback to optimal
        return { top: GREEN_TOP_3BAND, bottom: GREEN_BOTTOM_3BAND };
      case 'optimal':
        return { top: GREEN_TOP_3BAND, bottom: GREEN_BOTTOM_3BAND };
      case 'out-low':
        return { top: BOTTOM_RED_TOP_3BAND, bottom: BOTTOM_RED_BOTTOM_3BAND };
    }
  } else {
    // 4-band layout (MHS): RED / ORANGE / GREEN / RED
    switch (zone) {
      case 'out-high':
        return { top: TOP_RED_TOP_4BAND, bottom: TOP_RED_BOTTOM_4BAND };
      case 'in-range':
        return { top: ORANGE_TOP_4BAND, bottom: ORANGE_BOTTOM_4BAND };
      case 'optimal':
        return { top: GREEN_TOP_4BAND, bottom: GREEN_BOTTOM_4BAND };
      case 'out-low':
        return { top: BOTTOM_RED_TOP_4BAND, bottom: BOTTOM_RED_BOTTOM_4BAND };
    }
  }
}

function getDotYInScale(
  value: number,
  graphMin: number,
  graphMax: number,
  zone: StatusZone,
  has3Bands: boolean
): number {
  const H_TOTAL = has3Bands ? H_TOTAL_3BAND : H_TOTAL_4BAND;
  const totalSpan = graphMax - graphMin;
  if (totalSpan === 0) {
    const span = getZoneSpan(zone, has3Bands);
    return (span.top + span.bottom) / 2;
  }
  const t = Math.max(0, Math.min(1, (value - graphMin) / totalSpan));
  const yGlobal = (1 - t) * H_TOTAL;
  const span = getZoneSpan(zone, has3Bands);
  return Math.max(span.top, Math.min(span.bottom, yGlobal));
}

function getHighlightTint(zone: StatusZone): string {
  switch (zone) {
    case 'optimal':
      return 'rgba(34, 197, 94, 0.1)';
    case 'in-range':
      return 'rgba(251, 146, 60, 0.1)';
    case 'out-high':
    case 'out-low':
      return 'rgba(239, 68, 68, 0.1)';
  }
}

export function MiniIndicator({ biomarker }: MiniIndicatorProps) {
  const { currentValue, ranges } = biomarker;
  const searchParams = useSearchParams();
  const debugOutline = searchParams?.get('debugOutline') === '1';

  // Check if this biomarker has an orange "In range" band
  const hasInRangeBand = ranges.some(r => r.color === 'orange');
  const has3Bands = !hasInRangeBand; // 3-band layout if no orange band

  const { graphMin, graphMax } = deriveGraphDomain(biomarker);
  const zone = getStatusZone(currentValue, ranges, graphMin, graphMax);
  const dotYInScale = getDotYInScale(currentValue, graphMin, graphMax, zone, has3Bands);
  const zoneSpan = getZoneSpan(zone, has3Bands);
  const highlightTint = getHighlightTint(zone);

  const H_TOTAL = has3Bands ? H_TOTAL_3BAND : H_TOTAL_4BAND;
  const scaleTop = (CONTAINER_HEIGHT - H_TOTAL) / 2;
  const dotYAbsolute = scaleTop + dotYInScale;

  // Highlight height = exactly the same as the active pill segment (red/orange small, green tall)
  const highlightHeight = zoneSpan.bottom - zoneSpan.top;
  const highlightTop = scaleTop + zoneSpan.top;

  const dotColor =
    zone === 'optimal'
      ? getColorValue('green')
      : zone === 'in-range'
        ? getColorValue('orange')
        : getColorValue('red');
  const haloColor =
    zone === 'optimal'
      ? 'rgba(16, 185, 129, 0.32)'
      : zone === 'in-range'
        ? 'rgba(245, 158, 11, 0.32)'
        : 'rgba(239, 68, 68, 0.32)';

  return (
    <div
      className="relative"
      style={{
        width: `${CONTAINER_WIDTH}px`,
        height: `${CONTAINER_HEIGHT}px`,
        outline: debugOutline ? '1px solid blue' : 'none',
      }}
    >
      {/* 1) Highlight — height = active pill height; curved corners; connected to pills (no gap) */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: `${highlightTop}px`,
          width: `${HIGHLIGHT_WIDTH}px`,
          height: `${highlightHeight}px`,
          borderRadius: 9999,
          backgroundColor: highlightTint,
          outline: debugOutline ? '1px solid cyan' : 'none',
        }}
      />

      {/* 2) Marker: halo (outer) — reference: "translucent ring", "white ring separating dot from halo" */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${DOT_CENTER_X - DOT_HALO_OUTER / 2}px`,
          top: `${dotYAbsolute - DOT_HALO_OUTER / 2}px`,
          width: `${DOT_HALO_OUTER}px`,
          height: `${DOT_HALO_OUTER}px`,
          backgroundColor: haloColor,
          outline: debugOutline ? '1px solid green' : 'none',
        }}
      />

      {/* 3) White ring — reference: "thin, distinct white ring separating inner dot from outer halo" */}
      <div
        className="absolute rounded-full bg-white"
        style={{
          left: `${DOT_CENTER_X - (DOT_INNER_SIZE / 2 + DOT_WHITE_RING)}px`,
          top: `${dotYAbsolute - (DOT_INNER_SIZE / 2 + DOT_WHITE_RING)}px`,
          width: `${DOT_INNER_SIZE + DOT_WHITE_RING * 2}px`,
          height: `${DOT_INNER_SIZE + DOT_WHITE_RING * 2}px`,
          outline: debugOutline ? '1px solid silver' : 'none',
        }}
      />

      {/* 4) Inner solid dot */}
      <div
        className="absolute rounded-full"
        style={{
          left: `${DOT_CENTER_X - DOT_INNER_SIZE / 2}px`,
          top: `${dotYAbsolute - DOT_INNER_SIZE / 2}px`,
          width: `${DOT_INNER_SIZE}px`,
          height: `${DOT_INNER_SIZE}px`,
          backgroundColor: dotColor,
          outline: debugOutline ? '1px solid white' : 'none',
        }}
        aria-label={`Current value: ${currentValue}`}
      />

      {/* 5) Pill stack — immediately right of highlight (no gap), connected */}
      <div
        className="absolute flex flex-col items-stretch"
        style={{
          left: `${HIGHLIGHT_WIDTH}px`,
          top: `${scaleTop}px`,
          width: `${PILL_WIDTH}px`,
          gap: `${G}px`,
          outline: debugOutline ? '1px solid red' : 'none',
        }}
      >
        {/* Top red (high out-of-range) */}
        <div
          style={{
            width: `${PILL_WIDTH}px`,
            height: `${H_RED}px`,
            borderRadius: 9999,
            backgroundColor: getColorValue('red'),
          }}
        />
        {/* Orange "In range" - only show if biomarker has this band (e.g., MHS yes, Creatinine no) */}
        {hasInRangeBand && (
          <div
            style={{
              width: `${PILL_WIDTH}px`,
              height: `${H_ORANGE}px`,
              borderRadius: 9999,
              backgroundColor: getColorValue('orange'),
            }}
          />
        )}
        {/* Green optimal */}
        <div
          style={{
            width: `${PILL_WIDTH}px`,
            height: `${H_GREEN}px`,
            borderRadius: 9999,
            backgroundColor: getColorValue('green'),
          }}
        />
        {/* Bottom red (low out-of-range) */}
        <div
          style={{
            width: `${PILL_WIDTH}px`,
            height: `${H_RED}px`,
            borderRadius: 9999,
            backgroundColor: getColorValue('red'),
          }}
        />
      </div>

      {debugOutline && (
        <div
          className="absolute left-full ml-2 text-[9px] font-mono whitespace-nowrap bg-black/90 text-white p-1 rounded z-50"
          style={{ top: 0 }}
        >
          <div>value: {currentValue.toFixed(2)}</div>
          <div>zone: {zone}</div>
        </div>
      )}
    </div>
  );
}
