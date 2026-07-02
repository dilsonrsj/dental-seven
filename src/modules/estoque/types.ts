import type { SupplyRow } from "@/modules/procedimentos/types";
import type { AppointmentStatus } from "@/lib/supabase/types";

export type StockMovementType =
  | "inbound"
  | "outbound"
  | "adjustment"
  | "auto_deduction"
  | "auto_reversal";

export type StockAlertLevel = "ok" | "low" | "critical";

export type StockLevelInput = {
  quantity_on_hand: number;
  min_quantity: number | null;
};

export type PreferredSupplierRef = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type StockSupplyRow = SupplyRow & {
  quantity_on_hand: number;
  min_quantity: number | null;
  alert_level: StockAlertLevel;
  preferred_supplier: PreferredSupplierRef | null;
};

export type StockMovementRow = {
  id: string;
  clinic_id: string;
  supply_id: string;
  movement_type: StockMovementType;
  quantity: number;
  quantity_after: number;
  appointment_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type BomItemRef = {
  supply_id: string;
  quantity: number;
};

export type DeductionMovementDraft = {
  supply_id: string;
  quantity: number;
  movement_type: "auto_deduction";
};

export type ReversalMovementDraft = {
  supply_id: string;
  quantity: number;
  movement_type: "auto_reversal";
};

export type AppointmentStockTransition = {
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  procedureId: string | null;
  bomItems: BomItemRef[];
  alreadyApplied: boolean;
  estoqueModuleEnabled: boolean;
};

export type StockMovementFormInput = {
  supplyId: string;
  type: "inbound" | "outbound" | "adjustment";
  quantity: number;
  notes?: string;
};
