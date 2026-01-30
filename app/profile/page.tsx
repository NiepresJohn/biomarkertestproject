'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/src/components/DashboardLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Activity,
  TestTube,
  Stethoscope,
} from 'lucide-react';
import type { Profile } from '@/src/types/biomarker';
import { useAppointments } from '@/src/hooks/useAppointments';
import { Footer } from '@/src/components/Footer';
import { useNotification } from '@/src/contexts/NotificationContext';

function formatDate(dateStr: string, options: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

function getAgeGroup(age: number): string {
  if (age < 40) return '18–39 years';
  if (age < 60) return '40–59 years';
  return '60+ years';
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [biomarkerCount, setBiomarkerCount] = useState<number>(0);
  const [latestTestDate, setLatestTestDate] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { appointments, fetchAppointments } = useAppointments();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch('/api/profile');
        const data = await response.json();

        // Check if the response is successful and has valid data
        if (response.ok && !data.error && data.id) {
          setProfile(data);
          setPhone(data.phone || '+1 (555) 123-4567');
          setAddress(data.address || '123 Main St, San Francisco, CA 94102');
        } else {
          setProfile(null);
        }
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, address }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setSaveSuccess(true);
      setIsEditing(false);
      showSuccess('Profile updated successfully');

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to update profile';
      setSaveError(errorMsg);
      showError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    if (profile) {
      setPhone(profile.phone || '+1 (555) 123-4567');
      setAddress(profile.address || '123 Main St, San Francisco, CA 94102');
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchAppointments({ profile_id: profile.id });
    }
  }, [profile?.id, fetchAppointments]);

  useEffect(() => {
    async function loadBiomarkers() {
      try {
        const response = await fetch('/api/biomarkers');
        const data = await response.json();

        // Check if the response is successful
        if (!response.ok || data.error) {
          setBiomarkerCount(0);
          return;
        }

        const list = data.biomarkers ?? data;

        if (Array.isArray(list)) {
          setBiomarkerCount(list.length);

          // Find the latest test date from all biomarkers
          if (list.length > 0) {
            const dates = list
              .map((b: any) => b.date)
              .filter((d: any) => d)
              .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

            if (dates.length > 0) {
              setLatestTestDate(dates[0]);
            }
          }
        } else {
          setBiomarkerCount(0);
        }
      } catch {
        setBiomarkerCount(0);
      }
    }
    loadBiomarkers();
  }, []);

  const nextCheckup = useMemo(() => {
    const now = new Date();
    const upcoming = appointments
      .filter((a) => a.status === 'booked' && new Date(a.appointment_at) >= now)
      .sort((a, b) => new Date(a.appointment_at).getTime() - new Date(b.appointment_at).getTime());
    return upcoming[0] ?? null;
  }, [appointments]);
  const lastVisit = useMemo(() => {
    const now = new Date();
    const past = appointments
      .filter((a) => new Date(a.appointment_at) < now)
      .sort((a, b) => new Date(b.appointment_at).getTime() - new Date(a.appointment_at).getTime());
    return past[0] ?? null;
  }, [appointments]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            <p className="text-sm font-medium text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Profile not found</h2>
            <p className="mt-2 text-sm text-gray-500">
              We couldn't load your profile. Please try again later.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const initials = profile.full_name
    ? profile.full_name.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';
  const patientId = profile.id.split('-')[0].toUpperCase();

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Profile
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage your personal information
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isEditing
                    ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Profile summary card */}
            <div className="lg:col-span-1">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-white px-6 pt-8 pb-6">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-50 text-2xl font-semibold text-gray-700">
                    {initials}
                  </div>
                </div>
                <div className="px-6 pb-6 pt-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {profile.full_name || 'User'}
                    </h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Patient ID · {patientId}
                    </p>
                  </div>
                  <dl className="mt-6 space-y-4 border-t border-gray-100 pt-6">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Sex</dt>
                      <dd className="font-medium text-gray-900 capitalize">
                        {profile.sex}
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Age</dt>
                      <dd className="font-medium text-gray-900">
                        {profile.age} years
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Birthdate</dt>
                      <dd className="font-medium text-gray-900">
                        {profile.birthdate
                          ? formatDate(profile.birthdate, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Member since</dt>
                      <dd className="font-medium text-gray-900">
                        {formatDate(profile.created_at, {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* Details & health */}
            <div className="space-y-8 lg:col-span-2">
              {/* Contact & personal info */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Personal Information
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Contact and identification details
                  </p>
                </div>
                <div className="space-y-5 p-6">
                  {saveSuccess && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                      Profile updated successfully!
                    </div>
                  )}
                  {saveError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                      {saveError}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Full name
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={profile.full_name}
                        disabled
                        readOnly
                        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        value={profile.email || 'john.doe@example.com'}
                        disabled
                        readOnly
                        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <Phone className="h-5 w-5" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full rounded-lg border px-4 py-2.5 transition-colors focus:outline-none focus:ring-2 ${
                          isEditing
                            ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                            : 'border-gray-200 bg-gray-50 text-gray-900 cursor-default'
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={!isEditing}
                        className={`w-full rounded-lg border px-4 py-2.5 transition-colors focus:outline-none focus:ring-2 ${
                          isEditing
                            ? 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
                            : 'border-gray-200 bg-gray-50 text-gray-900 cursor-default'
                        }`}
                      />
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Health overview */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Health overview
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Reference ranges and visit summary
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
                  <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-blue-50/50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Age group</p>
                      <p className="mt-0.5 text-lg font-semibold text-gray-900">
                        {getAgeGroup(profile.age)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-emerald-50/50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <TestTube className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active tests</p>
                      <p className="mt-0.5 text-lg font-semibold text-gray-900">
                        {biomarkerCount} biomarker{biomarkerCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-violet-50/50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Latest test result</p>
                      <p className="mt-0.5 text-lg font-semibold text-gray-900">
                        {latestTestDate
                          ? formatDate(latestTestDate, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-xl border border-gray-100 bg-amber-50/50 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Next checkup</p>
                      <p className="mt-0.5 text-lg font-semibold text-gray-900">
                        {nextCheckup
                          ? formatDate(nextCheckup.appointment_at, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No upcoming appointment'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </DashboardLayout>
  );
}
