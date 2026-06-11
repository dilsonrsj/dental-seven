import type { Appointment, Dentist, Patient } from "@/lib/supabase/types";

export type PatientAppointmentWithRelations = Appointment & {
  dentist: Dentist | null;
  patient: Patient | null;
};
