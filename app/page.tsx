'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Biomarker, Profile } from '@/src/types/biomarker';
import { BiomarkerCard } from '@/src/components/BiomarkerCard';
import { BiomarkerModal } from '@/src/components/BiomarkerModal';
import { DashboardLayout } from '@/src/components/DashboardLayout';
import { Activity, AlertCircle, CheckCircle, User } from 'lucide-react';
import { Footer } from '@/src/components/Footer';
import { useNotification } from '@/src/contexts/NotificationContext';

export default function Home() {
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  // Load profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          // Check if the data is valid and not an error
          if (!data.error && data.id) {
            setProfile(data);
          }
        }
      } catch (error) {
        // Silently fail - profile is optional for display
      }
    }
    loadProfile();
  }, []);

  // Load data on mount
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

  // Calculate stats
  const optimalCount = biomarkers.filter(b => b.status === 'optimal').length;
  const outOfRangeCount = biomarkers.filter(b => b.status === 'out-of-range').length;
  const totalCount = biomarkers.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">Loading biomarkers...</div>
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
              Health Dashboard
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Welcome back! Here's your health overview for today
            </p>
          </div>
        </div>

        {/* Dashboard Overview */}
        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3 sm:gap-6 sm:mb-8">
            <div className="bg-white rounded-lg p-5 border border-gray-200 sm:p-7">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 mb-1.5 sm:text-base">Total Biomarkers</p>
                  <p className="text-3xl font-bold text-gray-900 sm:text-4xl">{totalCount}</p>
                </div>
                <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Activity className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 sm:p-7">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 mb-1.5 sm:text-base">Optimal</p>
                  <p className="text-3xl font-bold text-green-600 sm:text-4xl">{optimalCount}</p>
                </div>
                <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 border border-gray-200 sm:p-7">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 mb-1.5 sm:text-base">Needs Attention</p>
                  <p className="text-3xl font-bold text-red-600 sm:text-4xl">{outOfRangeCount}</p>
                </div>
                <div className="h-14 w-14 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <AlertCircle className="h-7 w-7 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Biomarkers + Schedule */}
          <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-3 lg:gap-6 lg:mb-8">
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5 sm:p-6 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:text-xl sm:mb-4">
                Recent Biomarkers
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {biomarkers.map((biomarker) => (
                  <BiomarkerCard
                    key={biomarker.id}
                    biomarker={biomarker}
                    onClick={() => handleCardClick(biomarker)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:gap-6 min-w-0">
              {/* Profile card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 h-fit">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:text-xl sm:mb-4">Profile</h2>
                {profile ? (
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {profile.full_name
                        ? profile.full_name.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                        : 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {profile.full_name || 'User'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {profile.sex === 'male' ? 'Male' : 'Female'} · {profile.age} years old
                      </p>
                      {profile.birthdate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Born {new Date(profile.birthdate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-500">
                    <User className="h-10 w-10 text-gray-300" />
                    <p className="text-sm">Loading profile...</p>
                  </div>
                )}
                <Link
                  href="/profile"
                  className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View full profile →
                </Link>
              </div>

              {/* Schedule card */}
              <Link
                href="/schedule"
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white block hover:opacity-95 transition-opacity h-fit"
              >
                <h3 className="text-base font-semibold mb-1.5 sm:text-lg sm:mb-2">Schedule Your Next Test</h3>
                <p className="text-blue-100 text-sm mb-3 sm:mb-4">
                  It's time for your routine checkup. Book an appointment today.
                </p>
                <span className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition">
                  Schedule Now
                </span>
              </Link>
            </div>
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
