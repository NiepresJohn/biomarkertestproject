'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAppointments } from '@/src/hooks/useAppointments';
import { useCurrentProfile } from '@/src/hooks/useCurrentProfile';
import { useNotification } from '@/src/contexts/NotificationContext';
import type { AppointmentSource } from '@/src/types/appointment';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  source: AppointmentSource;
  preselectedDate?: Date;
}

// Format Date to YYYY-MM-DD for input[type="date"]
function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Format Date to HH:mm for input[type="time"] (24h)
function toTimeInputValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Get minimum date (today) for the date input
function getMinDate(): string {
  return toDateInputValue(new Date());
}

// Build a Date from date string (YYYY-MM-DD) and time string (HH:mm) in local timezone
function toLocalDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}`);
}

// Default: always use system date (today) at 9:00 AM so year stays current
function getDefaultDateTime(_preselected?: Date): { date: string; time: string } {
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  return {
    date: toDateInputValue(base),
    time: toTimeInputValue(base),
  };
}

export function BookingModal({
  isOpen,
  onClose,
  onSuccess,
  source,
  preselectedDate,
}: BookingModalProps) {
  const router = useRouter();
  const { profile } = useCurrentProfile();
  const { createAppointment } = useAppointments();
  const { showSuccess, showError: showErrorToast } = useNotification();

  const defaultsForPreselected = getDefaultDateTime(preselectedDate);
  const [date, setDate] = useState(defaultsForPreselected.date);
  const [time, setTime] = useState(defaultsForPreselected.time);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    const defaults = getDefaultDateTime(preselectedDate);
    setDate(defaults.date);
    setTime(defaults.time);
    setNotes('');
    setError(null);
  }, [preselectedDate]);

  // Sync form when modal opens or preselectedDate changes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) {
      const msg = 'Please wait for your profile to load.';
      setError(msg);
      showErrorToast(msg);
      return;
    }

    const defaults = getDefaultDateTime(preselectedDate);
    const dateStr = date.trim() || defaults.date;
    const timeStr = time.trim() || defaults.time;
    if (!dateStr || !timeStr) {
      const msg = 'Please select both date and time.';
      setError(msg);
      showErrorToast(msg);
      return;
    }

    const appointmentDate = toLocalDate(dateStr, timeStr);
    if (isNaN(appointmentDate.getTime())) {
      const msg = 'Invalid date or time.';
      setError(msg);
      showErrorToast(msg);
      return;
    }
    const now = new Date();
    if (appointmentDate < now) {
      const msg = 'Please select a future date and time.';
      setError(msg);
      showErrorToast(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAppointment({
        profile_id: profile.id,
        appointment_at: appointmentDate.toISOString(),
        source,
        notes: notes.trim() || undefined,
      });
      showSuccess('Appointment booked successfully.');
      handleClose();
      onSuccess?.();
      router.push('/schedule');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create appointment';
      setError(message);
      showErrorToast(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const minDate = getMinDate();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-[1400] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="booking-modal-title" className="text-xl font-semibold text-gray-900">
            Book Appointment
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Date */}
            <div>
              <label htmlFor="booking-date" className="mb-1.5 block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                id="booking-date"
                type="date"
                required
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Time */}
            <div>
              <label htmlFor="booking-time" className="mb-1.5 block text-sm font-medium text-gray-700">
                Time
              </label>
              <input
                id="booking-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="booking-notes" className="mb-1.5 block text-sm font-medium text-gray-700">
                Notes (optional)
              </label>
              <textarea
                id="booking-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                placeholder="Add any additional notes for your appointment..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-row justify-end gap-3 border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !profile}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
