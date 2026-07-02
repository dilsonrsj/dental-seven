export type FinancialEntryType =
  | "revenue"
  | "revenue_reversal"
  | "variable_cost"
  | "variable_cost_reversal"
  | "manual_revenue"
  | "manual_expense";

export type FinancialEntrySource = "auto" | "manual";

export type ManualEntryKind = "revenue" | "expense";

export type SummaryEntry = {
  entry_type: FinancialEntryType;
  amount_cents: number;
};

export type MonthSummary = {
  revenueCents: number;
  variableCostCents: number;
  fixedCostsCents: number;
  marginCents: number;
};

export type FinancialEntryRow = {
  id: string;
  clinic_id: string;
  entry_type: FinancialEntryType;
  source: FinancialEntrySource;
  amount_cents: number;
  appointment_id: string | null;
  procedure_id: string | null;
  dentist_id: string | null;
  description: string;
  entry_date: string;
  created_by: string | null;
  created_at: string;
};

export type ClinicMonthlySettingsRow = {
  clinic_id: string;
  year_month: string;
  fixed_costs_cents: number;
  updated_at: string;
};

export type ManualEntryFormInput = {
  kind: ManualEntryKind;
  amountCents: number;
  description: string;
  entryDate?: string;
};

export type FixedCostsFormInput = {
  yearMonth: string;
  fixedCostsCents: number;
};
