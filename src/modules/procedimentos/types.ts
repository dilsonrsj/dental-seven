export type ProcedureRow = {
  id: string;
  clinic_id: string;
  name: string;
  base_price_cents: number;
  default_duration_min: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SupplyRow = {
  id: string;
  clinic_id: string;
  name: string;
  unit_label: string;
  unit_cost_cents: number | null;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProcedureBomRow = {
  id: string;
  clinic_id: string;
  procedure_id: string;
  supply_id: string;
  quantity: number;
  supply: SupplyRow | null;
};

export type ProcedureFormInput = {
  name: string;
  base_price_cents: number;
  default_duration_min: number;
};

export type SupplyFormInput = {
  name: string;
  unit_label?: string;
  unit_cost_cents?: number | null;
  sku?: string | null;
};

export type ProcedureBomItemInput = {
  procedureId: string;
  supplyId: string;
  quantity: number;
};
