import dayjs from 'dayjs';
import type { TimeSlot } from '@/src/types/appointment';

// Time slot configuration
export const APPOINTMENT_CONFIG = {
  START_HOUR: 9, // 9:00 AM
  END_HOUR: 17, // 5:00 PM (last slot at 4:30 PM)
  INTERVAL_MINUTES: 30,
};

// Generate all available time slots for a given date
export function generateTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const { START_HOUR, END_HOUR, INTERVAL_MINUTES } = APPOINTMENT_CONFIG;

  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += INTERVAL_MINUTES) {
      const datetime = new Date(date);
      datetime.setHours(hour, minute, 0, 0);

      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const label = dayjs(datetime).format('h:mm A');

      slots.push({
        time,
        label,
        datetime,
        isBooked: false, // Will be updated based on fetched appointments
      });
    }
  }

  return slots;
}

// Format a time slot for display
export function formatTimeSlot(datetime: Date | string): string {
  return dayjs(datetime).format('h:mm A');
}

// Get suggested appointment date (1 year from a given date)
export function getSuggestedAppointmentDate(fromDate: Date | string): Date {
  return dayjs(fromDate).add(1, 'year').toDate();
}

// Convert local datetime to ISO string (for API)
export function toISOString(date: Date): string {
  return date.toISOString();
}

// Check if a time slot is in the past
export function isTimeSlotPast(datetime: Date): boolean {
  return datetime < new Date();
}
