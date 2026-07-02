export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "sent" | "delivered" | "read";

export interface Clinic {
  id: string;
  name: string;
  slug: string;
}

export interface Dentist {
  id: string;
  clinic_id: string;
  name: string;
  color: string;
  active: boolean;
}

export interface Patient {
  id: string;
  clinic_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  birth_date: string | null;
  notes: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  dentist_id: string;
  patient_id: string;
  starts_at: string;
  ends_at: string;
  duration_min: number;
  status: AppointmentStatus;
  procedure_id?: string | null;
  procedure_label: string;
  notes: string | null;
}

export interface WhatsappThread {
  id: string;
  clinic_id: string;
  patient_id: string;
  last_message_at: string;
}

export interface WhatsappMessage {
  id: string;
  thread_id: string;
  direction: MessageDirection;
  body: string;
  sent_at: string;
  status: MessageStatus;
}

export const DEMO_CLINIC_ID = "11111111-1111-1111-1111-111111111111";
