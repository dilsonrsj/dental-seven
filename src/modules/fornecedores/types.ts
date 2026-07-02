export type SupplierRow = {
  id: string;
  clinic_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SupplierFormInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

export type SupplyLinkRow = {
  id: string;
  name: string;
  unit_label: string;
  preferred_supplier_id: string | null;
};
