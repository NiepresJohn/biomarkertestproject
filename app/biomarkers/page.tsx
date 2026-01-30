'use client';

import { useState, useEffect } from 'react';
import { Biomarker } from '@/src/types/biomarker';
import { BiomarkerCard } from '@/src/components/BiomarkerCard';
import { BiomarkerModal } from '@/src/components/BiomarkerModal';
import { DashboardLayout } from '@/src/components/DashboardLayout';
import { Activity, Filter } from 'lucide-react';
import { Footer } from '@/src/components/Footer';
import { useNotification } from '@/src/contexts/NotificationContext';

export default function BiomarkersPage() {
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'optimal' | 'in-range' | 'out-of-range'>('all');
  const { showError } = useNotification();

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/biomarkers');
        const data = await response.json();

        // Check if the response is an error
        if (!response.ok || data.error) {
          showError(data.error || 'Failed to load biomarkers');
          setBiomarkers([]);
          return;
        }

        // Handle new API format: { biomarkers: [...], debug: [...] }
        if (data.biomarkers && Array.isArray(data.biomarkers)) {
          setBiomarkers(data.biomarkers);
        } else if (Array.isArray(data)) {
          // Fallback for old format (array of biomarkers)
          setBiomarkers(data);
        } else {
          // Invalid format
          setBiomarkers([]);
        }
      } catch (error) {
        showError('Failed to load biomarkers');
        setBiomarkers([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [showError]);

  const handleCardClick = (biomarker: Biomarker) => {
    setSelectedBiomarker(biomarker);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedBiomarker(null), 300);
  };

  const filteredBiomarkers = filter === 'all'
    ? biomarkers
    : biomarkers.filter(b => b.status === filter);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading biomarkers...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-1 sm:text-2xl lg:text-3xl sm:mb-2">
              Biomarkers
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Monitor all your biomarkers and health metrics
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Filter className="h-5 w-5 text-gray-500 shrink-0" />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All ({biomarkers.length})
              </button>
              <button
                onClick={() => setFilter('optimal')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  filter === 'optimal'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Optimal ({biomarkers.filter(b => b.status === 'optimal').length})
              </button>
              <button
                onClick={() => setFilter('in-range')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  filter === 'in-range'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                In Range ({biomarkers.filter(b => b.status === 'in-range').length})
              </button>
              <button
                onClick={() => setFilter('out-of-range')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                  filter === 'out-of-range'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Out of Range ({biomarkers.filter(b => b.status === 'out-of-range').length})
              </button>
            </div>
          </div>
        </div>

        {/* Biomarkers List */}
        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="max-w-[1200px] mx-auto min-w-0">
            {filteredBiomarkers.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No biomarkers found with this filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBiomarkers.map((biomarker) => (
                  <BiomarkerCard
                    key={biomarker.id}
                    biomarker={biomarker}
                    onClick={() => handleCardClick(biomarker)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>

      <BiomarkerModal
        biomarker={selectedBiomarker}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </DashboardLayout>
  );
}
