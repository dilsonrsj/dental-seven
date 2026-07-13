import type { AnamnesisResponses } from "./template-v1";

export type PatientAnamnesis = {
  id: string;
  clinic_id: string;
  patient_id: string;
  template_version: string;
  responses: AnamnesisResponses;
  has_critical_alert: boolean;
  filled_by: string | null;
  created_at: string;
  updated_at: string;
};
