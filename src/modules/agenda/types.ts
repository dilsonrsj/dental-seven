import type {
  Appointment,
  AppointmentStatus,
  Dentist,
  Patient,
} from "@/lib/supabase/types";

export type AppointmentWithRelations = Appointment & {
  dentist: Dentist | null;
  patient: Patient | null;
};

export type AppointmentFormInput = {
  id?: string;
  patient_id: string;
  dentist_id: string;
  starts_at: string;
  duration_min: number;
  procedure_label: string;
  status: AppointmentStatus;
  notes?: string | null;
};

export type AgendaInitialData = {
  appointments: AppointmentWithRelations[];
  dentists: Dentist[];
  patients: Patient[];
};
