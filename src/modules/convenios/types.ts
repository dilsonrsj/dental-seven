export type InsuranceClaimStatus =
  | "draft"
  | "awaiting_auth"
  | "authorized"
  | "submitted"
  | "paid"
  | "partial_glosa"
  | "glosa"
  | "appealing";

export type InsuranceCarrierRow = {
  id: string;
  clinic_id: string;
  name: string;
  ans_registry: string | null;
  provider_code: string | null;
  portal_url: string | null;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InsurancePlanRow = {
  id: string;
  clinic_id: string;
  carrier_id: string;
  name: string;
  requires_pre_auth: boolean;
  coverage_notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InsuranceCarrierWithPlans = InsuranceCarrierRow & {
  plans: InsurancePlanRow[];
};

export type InsurancePlanOption = {
  plan_id: string;
  plan_name: string;
  carrier_name: string;
  requires_pre_auth: boolean;
};

export type PatientEnrollmentRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  plan_id: string;
  card_number: string;
  holder_name: string | null;
  valid_until: string | null;
  is_primary: boolean;
  plan_name: string;
  carrier_name: string;
};

export type InsuranceProcedurePriceRow = {
  id: string;
  plan_id: string;
  procedure_id: string;
  price_cents: number;
  tuss_code: string | null;
  procedure_name: string;
};

export type InsuranceClaimRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  plan_id: string;
  appointment_id: string | null;
  procedure_id: string | null;
  status: InsuranceClaimStatus;
  auth_password: string | null;
  submitted_amount_cents: number;
  paid_amount_cents: number | null;
  glosa_reason: string;
  glosa_amount_cents: number | null;
  submitted_at: string | null;
  paid_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  patient_name: string;
  plan_name: string;
  carrier_name: string;
};

export type CarrierFormInput = {
  name: string;
  ans_registry?: string | null;
  provider_code?: string | null;
  portal_url?: string | null;
  notes?: string | null;
};

export type PlanFormInput = {
  carrier_id: string;
  name: string;
  requires_pre_auth: boolean;
  coverage_notes?: string | null;
};

export type EnrollmentFormInput = {
  patient_id: string;
  plan_id: string;
  card_number: string;
  holder_name?: string | null;
  valid_until?: string | null;
  is_primary: boolean;
};
