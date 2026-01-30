'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import dayjs from 'dayjs';
import type { Appointment, AppointmentStatus } from '@/src/types/appointment';
import { formatTimeSlot } from '@/src/config/appointments';
import { useNotification } from '@/src/contexts/NotificationContext';

interface AppointmentsListProps {
  appointments: Appointment[];
  selectedDate: Date | null;
  onCancelAppointment: (id: string) => Promise<void>;
  loading?: boolean;
}

// Status badge colors
const statusColors: Record<AppointmentStatus, 'primary' | 'default' | 'success'> = {
  booked: 'primary',
  cancelled: 'default',
  completed: 'success',
};

export function AppointmentsList({
  appointments,
  selectedDate,
  onCancelAppointment,
  loading = false,
}: AppointmentsListProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleCancelClick = (apt: Appointment) => {
    setAppointmentToCancel(apt);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return;

    setCancelling(true);
    try {
      await onCancelAppointment(appointmentToCancel.id);
      showSuccess('Appointment cancelled successfully');
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelDialogClose = () => {
    if (!cancelling) {
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };
  // Filter appointments for selected date
  const filteredAppointments = selectedDate
    ? appointments.filter((apt) => {
        const aptDate = new Date(apt.appointment_at);
        return (
          aptDate.getFullYear() === selectedDate.getFullYear() &&
          aptDate.getMonth() === selectedDate.getMonth() &&
          aptDate.getDate() === selectedDate.getDate()
        );
      })
    : appointments;

  // Categorize appointments
  const now = new Date();
  const upcoming = filteredAppointments.filter(
    (apt) => new Date(apt.appointment_at) >= now && apt.status === 'booked'
  );
  const completed = filteredAppointments.filter(
    (apt) => apt.status === 'completed'
  );
  const cancelled = filteredAppointments.filter(
    (apt) => apt.status === 'cancelled'
  );

  // Empty state
  if (filteredAppointments.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          textAlign: 'center',
          py: 4,
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {selectedDate
            ? `No appointments on ${dayjs(selectedDate).format('MMMM D, YYYY')}`
            : 'No appointments scheduled'}
        </Typography>
        {!selectedDate && (
          <Typography variant="body2" color="text.secondary">
            Your appointments will appear here once you book them
          </Typography>
        )}
      </Box>
    );
  }

  const renderAppointment = (apt: Appointment) => {
    const canCancel = apt.status === 'booked' && new Date(apt.appointment_at) >= now;
    const isPast = new Date(apt.appointment_at) < now;

    return (
      <Card
        key={apt.id}
        variant="outlined"
        sx={{
          mb: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            borderColor: 'primary.light',
          },
          opacity: apt.status === 'cancelled' ? 0.7 : 1,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box>
              <Typography variant="h5" component="div" fontWeight="600" sx={{ mb: 0.5 }}>
                {formatTimeSlot(apt.appointment_at)}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {dayjs(apt.appointment_at).format('dddd, MMMM D, YYYY')}
              </Typography>
            </Box>
            <Chip
              label={apt.status}
              color={statusColors[apt.status]}
              size="medium"
              sx={{
                textTransform: 'capitalize',
                fontWeight: 600,
                minWidth: 90,
              }}
            />
          </Box>

          {apt.notes && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                borderLeft: '3px solid',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {apt.notes}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Source: {apt.source === 'schedule_page' ? 'Schedule Page' : 'Biomarker Modal'}
            </Typography>

            {canCancel && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleCancelClick(apt)}
                disabled={loading}
              >
                Cancel Appointment
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const hasMultipleSections = [upcoming.length > 0, completed.length > 0, cancelled.length > 0].filter(Boolean).length > 1;

  return (
    <>
      <Box>
        {/* Upcoming Appointments */}
        {upcoming.length > 0 && (
          <Box sx={{ mb: hasMultipleSections ? 4 : 0 }}>
            {hasMultipleSections && (
              <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                Upcoming Appointments
              </Typography>
            )}
            {upcoming.map(renderAppointment)}
          </Box>
        )}

        {/* Completed Appointments */}
        {completed.length > 0 && (
          <Box sx={{ mb: cancelled.length > 0 ? 4 : 0 }}>
            {(upcoming.length > 0 || hasMultipleSections) && <Divider sx={{ mb: 3 }} />}
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'success.main' }}>
              Completed Appointments
            </Typography>
            {completed.map(renderAppointment)}
          </Box>
        )}

        {/* Cancelled Appointments */}
        {cancelled.length > 0 && (
          <Box>
            {(upcoming.length > 0 || completed.length > 0) && <Divider sx={{ mb: 3 }} />}
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.secondary' }}>
              Cancelled Appointments
            </Typography>
            {cancelled.map(renderAppointment)}
          </Box>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelDialogClose}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">
          Cancel Appointment?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Are you sure you want to cancel your appointment on{' '}
            <strong>
              {appointmentToCancel &&
                dayjs(appointmentToCancel.appointment_at).format('MMMM D, YYYY [at] h:mm A')}
            </strong>
            ? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDialogClose}
            disabled={cancelling}
            color="inherit"
          >
            Keep Appointment
          </Button>
          <Button
            onClick={handleCancelConfirm}
            color="error"
            variant="contained"
            disabled={cancelling}
            autoFocus
          >
            {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
