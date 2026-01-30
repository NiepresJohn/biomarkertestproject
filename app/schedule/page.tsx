'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/src/components/DashboardLayout';
import { Box, Button, Typography, Paper, CircularProgress, Alert, Divider } from '@mui/material';
import { Plus } from 'lucide-react';
import dayjs from 'dayjs';
import { AppointmentsList } from '@/src/components/AppointmentsList';
import { BookingModal } from '@/src/components/BookingModal';
import { useCurrentProfile } from '@/src/hooks/useCurrentProfile';
import { useAppointments } from '@/src/hooks/useAppointments';
import { Footer } from '@/src/components/Footer';
import { useNotification } from '@/src/contexts/NotificationContext';

export default function SchedulePage() {
  const { profile, loading: profileLoading, error: profileError } = useCurrentProfile();
  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
    cancelAppointment,
  } = useAppointments();
  const { showSuccess, showError } = useNotification();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Fetch appointments when profile loads
  useEffect(() => {
    if (profile) {
      fetchAppointments({ profile_id: profile.id });
    }
  }, [profile, fetchAppointments]);

  // Handle appointment booking success
  const handleBookingSuccess = () => {
    if (profile) {
      fetchAppointments({ profile_id: profile.id });
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async (id: string) => {
    try {
      await cancelAppointment(id);
      showSuccess('Appointment cancelled successfully');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to cancel appointment');
    }
  };

  // Loading state
  if (profileLoading) {
    return (
      <DashboardLayout>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  // Error state
  if (profileError) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            Failed to load profile: {profileError}
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  // Categorize appointments for stats
  const now = new Date();
  const upcomingCount = appointments.filter(
    (apt) => new Date(apt.appointment_at) >= now && apt.status === 'booked'
  ).length;
  const completedCount = appointments.filter((apt) => apt.status === 'completed').length;
  const cancelledCount = appointments.filter((apt) => apt.status === 'cancelled').length;

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-1 sm:text-2xl lg:text-3xl sm:mb-2">
                Schedule
              </h1>
              <p className="text-sm text-gray-600 sm:text-base">
                Manage your appointments and upcoming tests
              </p>
            </div>
            <Button
              variant="contained"
              startIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsBookingModalOpen(true)}
              disabled={!profile}
              size="medium"
              className="!shrink-0"
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              Book Appointment
            </Button>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          {appointmentsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {appointmentsError}
            </Alert>
          )}

          {/* Stats Summary */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {upcomingCount}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Upcoming
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="success.main">
                  {completedCount}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Completed
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold" color="text.secondary">
                  {cancelledCount}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Cancelled
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold">
                  {appointments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Total
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Appointments List */}
          {appointmentsLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 8,
              }}
            >
              <CircularProgress />
            </Box>
          ) : appointments.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No appointments yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Book your first appointment to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsBookingModalOpen(true)}
              >
                Book Appointment
              </Button>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e5e7eb' }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                All Appointments
              </Typography>
              <AppointmentsList
                appointments={appointments}
                selectedDate={null}
                onCancelAppointment={handleCancelAppointment}
                loading={appointmentsLoading}
              />
            </Paper>
          )}
        </div>

        <Footer />
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
        source="schedule_page"
      />
    </DashboardLayout>
  );
}
