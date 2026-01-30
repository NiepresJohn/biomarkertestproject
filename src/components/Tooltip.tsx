'use client';

interface TooltipProps {
  value: number;
  unit: string;
  position: { x: number; y: number };
}

export function Tooltip({ value, unit, position }: TooltipProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -120%)',
        zIndex: 50,
      }}
    >
      <div
        className="px-3 py-1.5 bg-white text-gray-900 text-sm font-medium rounded-md whitespace-nowrap border border-gray-200"
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {value} {unit}
      </div>
    </div>
  );
}
