'use client';

import { useState, useRef, useEffect } from 'react';
import { Biomarker } from '@/src/types/biomarker';
import { ScatterChart } from '@mui/x-charts/ScatterChart';
import Box from '@mui/material/Box';

interface ChartAreaProps {
  biomarker: Biomarker;
}

export function ChartArea({ biomarker }: ChartAreaProps) {
  const { currentValue, ranges, unit, date } = biomarker;
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);

  // Calculate future test date (1 year from latest result)
  const latestDate = new Date(date);
  const futureDate = new Date(latestDate);
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Sort ranges by order
  const sortedRanges = [...ranges].sort((a, b) => a.order - b.order);

  // Calculate total range span for Y-axis
  const allValues = sortedRanges.flatMap(r => [r.min, r.max].filter(v => v !== null)) as number[];
  const totalMin = Math.min(...allValues);
  const totalMax = Math.max(...allValues);

  // Find the top out-of-range band for tinted overlay
  const topOutOfRange = sortedRanges.find((r, idx) =>
    r.color === 'red' && idx === sortedRanges.length - 1
  );

  // Prepare scatter data: Latest result and Future placeholder
  // Use date strings that are easier to work with for X-axis positioning
  const latestDateObj = new Date(date);
  const futureDateObj = futureDate;

  // Create separate series for different marker types
  const latestData = [{ x: latestDateObj.getTime(), y: currentValue, id: 'latest' }];
  const futureData = [{ x: futureDateObj.getTime(), y: currentValue, id: 'future' }];

  // Responsive width
  useEffect(() => {
    const updateWidth = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.clientWidth || 800;
        setChartWidth(Math.min(containerWidth, 800));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate tinted band position for top out-of-range zone
  const topBandStart = topOutOfRange
    ? (topOutOfRange.min ?? totalMin)
    : null;

  return (
    <div className="relative w-full" style={{ paddingBottom: '60px' }} ref={chartRef}>
      <Box sx={{ width: '100%', height: 400, position: 'relative' }}>
        {/* Top tinted pink band overlay */}
        {topOutOfRange && topBandStart && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: '60px', // Account for Y-axis margin
              right: '20px',
              top: '20px', // Account for top margin
              height: `${((totalMax - (topOutOfRange.min ?? totalMax)) / (totalMax - totalMin)) * 350}px`,
              backgroundColor: 'rgba(254, 226, 226, 0.5)',
              zIndex: 1,
            }}
          />
        )}

        {/* Vertical dashed reference line at latest result */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 'calc(60px + 20%)', // Y-axis margin + 20% into chart
            top: '20px',
            bottom: '30px',
            width: '2px',
            backgroundImage: 'linear-gradient(to bottom, #EF4444 50%, transparent 50%)',
            backgroundSize: '2px 8px',
            zIndex: 2,
          }}
        />

        <ScatterChart
          series={[
            {
              data: latestData,
              label: 'Latest result',
              id: 'latest-series',
              markerSize: 10,
              color: '#EF4444', // Red for latest
            },
            {
              data: futureData,
              label: 'Future',
              id: 'future-series',
              markerSize: 10,
              color: '#9CA3AF', // Gray for future
            },
          ]}
          xAxis={[{
            min: latestDateObj.getTime() - (futureDateObj.getTime() - latestDateObj.getTime()) * 0.15,
            max: futureDateObj.getTime() + (futureDateObj.getTime() - latestDateObj.getTime()) * 0.15,
            valueFormatter: (value: number) => '',
            tickNumber: 0,
          }]}
          yAxis={[{
            min: totalMin,
            max: totalMax,
            label: unit,
          }]}
          grid={{ vertical: false, horizontal: true }}
          margin={{ top: 20, right: 20, bottom: 30, left: 60 }}
          sx={{
            '& .MuiChartsAxis-bottom .MuiChartsAxis-line': {
              stroke: '#E5E7EB',
              strokeWidth: 1,
            },
            '& .MuiChartsAxis-left .MuiChartsAxis-line': {
              stroke: '#E5E7EB',
            },
            '& .MuiChartsAxis-tick': {
              stroke: '#E5E7EB',
            },
            '& .MuiChartsAxis-tickLabel': {
              fill: '#6B7280',
              fontSize: '12px',
            },
            '& .MuiChartsGrid-line': {
              stroke: '#F3F4F6',
              strokeWidth: 0.5,
            },
            '& .MuiChartsAxis-label': {
              fill: '#6B7280',
              fontSize: '12px',
            },
          }}
        />
      </Box>

      {/* Bottom axis labels */}
      <div className="relative" style={{ height: '60px', marginTop: '8px' }}>
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: 'calc(60px + 20%)',
            top: '0',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-xs text-gray-500 whitespace-nowrap font-medium">
            Latest result
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">
            {formatDate(date)}
          </div>
        </div>
        <div
          className="absolute text-xs text-gray-500"
          style={{
            right: 'calc(20px + 15%)',
            top: '0',
            whiteSpace: 'nowrap',
          }}
        >
          {futureDate.getFullYear()}
        </div>
      </div>
    </div>
  );
}
