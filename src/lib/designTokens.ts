export const colors = {
  status: {
    optimal: '#10B981',    // green-500
    inRange: '#F59E0B',    // amber-500
    outOfRange: '#EF4444', // red-500
  },
  clinical: {
    background: '#FFFFFF',
    border: '#E5E7EB',     // gray-200
    text: {
      primary: '#111827',   // gray-900
      secondary: '#6B7280', // gray-500
      muted: '#9CA3AF',    // gray-400
    },
  },
  chart: {
    outOfRangeTint: 'rgba(254, 226, 226, 0.5)', // Light pink tint for out-of-range high
    axisLine: '#E5E7EB',  // gray-200
    dashedLine: '#EF4444', // red-500
  },
} as const;

export const spacing = {
  card: {
    padding: '1rem',
    gap: '0.5rem',
  },
  modal: {
    padding: '2rem',
  },
} as const;

export const borderRadius = {
  card: '8px',
  tooltip: '6px',
  modal: '12px',
} as const;

export const boxShadow = {
  card: '0 1px 3px rgba(0, 0, 0, 0.1)',
  cardHover: '0 4px 6px rgba(0, 0, 0, 0.1)',
  modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  tooltip: '0 2px 8px rgba(0, 0, 0, 0.15)',
} as const;
