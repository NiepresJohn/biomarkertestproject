// Appointment status types
export type AppointmentStatus = 'booked' | 'cancelled' | 'completed';

// Appointment source types
export type AppointmentSource = 'schedule_page' | 'biomarker_modal';

// Main appointment interface
export interface Appointment {
  id: string;
  profile_id: string;
  appointment_at: string; // ISO 8601 timestamp (UTC)
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Input for creating a new appointment
export interface CreateAppointmentInput {
  profile_id: string;
  appointment_at: string; // ISO 8601 timestamp
  source: AppointmentSource;
  notes?: string;
}

// Input for updating an existing appointment
export interface UpdateAppointmentInput {
  status?: AppointmentStatus;
  notes?: string;
}

// Time slot representation
export interface TimeSlot {
  time: string; // Format: "HH:mm" (24-hour)
  label: string; // Format: "h:mm A" (12-hour with AM/PM)
  datetime: Date; // Full datetime object for the slot
  isBooked: boolean;
}

// Highlighted day for calendar badges
export interface HighlightedDay {
  day: number; // Day of month (1-31)
}
