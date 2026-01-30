import { useState, useCallback } from 'react';
import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '@/src/types/appointment';

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  fetchAppointments: (filters?: {
    profile_id?: string;
    start_date?: string;
    end_date?: string;
    date?: string;
    status?: string;
  }) => Promise<void>;
  createAppointment: (input: CreateAppointmentInput) => Promise<Appointment>;
  updateAppointment: (id: string, input: UpdateAppointmentInput) => Promise<Appointment>;
  cancelAppointment: (id: string) => Promise<Appointment>;
}

export function useAppointments(): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments with optional filters
  const fetchAppointments = useCallback(async (filters?: {
    profile_id?: string;
    start_date?: string;
    end_date?: string;
    date?: string;
    status?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.profile_id) params.append('profile_id', filters.profile_id);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`/api/appointments?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new appointment with optimistic update
  const createAppointment = useCallback(async (input: CreateAppointmentInput): Promise<Appointment> => {
    setError(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }

      const newAppointment = await response.json() as Appointment;

      // Optimistic update: add to local state
      setAppointments((prev) => [...prev, newAppointment].sort(
        (a, b) => new Date(a.appointment_at).getTime() - new Date(b.appointment_at).getTime()
      ));

      return newAppointment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    }
  }, []);

  // Update appointment with optimistic update
  const updateAppointment = useCallback(async (
    id: string,
    input: UpdateAppointmentInput
  ): Promise<Appointment> => {
    setError(null);

    // Optimistic update: update local state immediately
    const previousAppointments = [...appointments];
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, ...input } : apt))
    );

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        // Rollback on error
        setAppointments(previousAppointments);
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update appointment');
      }

      const updatedAppointment = await response.json() as Appointment;

      // Update with server response
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? updatedAppointment : apt))
      );

      return updatedAppointment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    }
  }, [appointments]);

  // Cancel appointment (convenience method)
  const cancelAppointment = useCallback(async (id: string): Promise<Appointment> => {
    return updateAppointment(id, { status: 'cancelled' });
  }, [updateAppointment]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
  };
}
