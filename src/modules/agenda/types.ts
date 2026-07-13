import type {
  Appointment,
  AppointmentStatus,
  Dentist,
  Patient,
} from "@/lib/supabase/types";
import type { AgendaOperatingHoursData } from "./operating-hours-actions";

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
  procedure_id?: string | null;
  procedure_label: string;
  status: AppointmentStatus;
  notes?: string | null;
  payment_source?: "particular" | "insurance";
  insurance_plan_id?: string | null;
};

export type InsurancePlanChoice = {
  plan_id: string;
  plan_name: string;
  carrier_name: string;
};

export type AgendaInitialData = {
  appointments: AppointmentWithRelations[];
  dentists: Dentist[];
  patients: Patient[];
  operatingHours: AgendaOperatingHoursData;
};
