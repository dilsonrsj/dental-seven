import type { SelectedDentistId } from "@/contexts/dentist-filter-context";
import type { AppointmentWithRelations } from "./types";

export function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const day = start.getUTCDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  start.setUTCDate(start.getUTCDate() - distanceFromMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const weekDay = new Date(start);
    weekDay.setUTCDate(start.getUTCDate() + index);
    return weekDay;
  });
}

export function getAppointmentsForDate(
  appointments: AppointmentWithRelations[],
  date: Date,
): AppointmentWithRelations[] {
  const dayKey = toDateKey(date);

  return appointments
    .filter((appointment) => toDateKey(new Date(appointment.starts_at)) === dayKey)
    .toSorted(
      (left, right) =>
        new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
    );
}

export function filterAppointmentsByDentist(
  appointments: AppointmentWithRelations[],
  selectedDentistId: SelectedDentistId,
): AppointmentWithRelations[] {
  if (selectedDentistId === "all") return appointments;
  return appointments.filter(
    (appointment) => appointment.dentist_id === selectedDentistId,
  );
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
