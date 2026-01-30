'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import FocusTrap from 'focus-trap-react';
import { Biomarker } from '@/src/types/biomarker';
import { BiomarkerGraph } from './BiomarkerGraph';

interface BiomarkerModalProps {
  biomarker: Biomarker | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BiomarkerModal({ biomarker, isOpen, onClose }: BiomarkerModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !biomarker) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <FocusTrap>
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Top row: title left, close right */}
          <div className="flex items-start justify-between gap-4 pt-6 px-8 pb-2">
            <h1 id="modal-title" className="text-2xl font-semibold text-gray-900">
              {biomarker.name}
            </h1>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          {/* Subtitle: Current | Reference */}
          <p className="text-sm text-gray-500 px-8 pb-4">
            Current: <span className="font-medium text-gray-900">{biomarker.currentValue} {biomarker.unit}</span>
            {' | '}
            Reference: {biomarker.referenceRange}
          </p>
          {/* Graph region: legend + chart (no top legend) */}
          <div className="px-8 pb-8 pt-2">
            <BiomarkerGraph biomarker={biomarker} />
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
