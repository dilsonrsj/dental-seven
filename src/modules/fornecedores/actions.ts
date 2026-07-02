"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";
import type { SupplierFormInput, SupplierRow, SupplyLinkRow } from "./types";
import {
  assertSupplierEmail,
  assertSupplierName,
  assertSupplierPhone,
} from "./validation";

async function requireFornecedoresModule() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Sessão inválida.");
  if (!ctx.enabledModules.includes("fornecedores")) {
    throw new Error("Módulo Fornecedores não está ativo para esta clínica.");
  }
  return ctx;
}

async function assertWritableAdmin() {
  const ctx = await requireFornecedoresModule();
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Apenas o administrador pode alterar fornecedores.");
  }
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
  return ctx;
}

async function requireSupplyInClinic(supplyId: string, clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("id", supplyId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Insumo não encontrado.");
}

async function requireActiveSupplierInClinic(
  supplierId: string,
  clinicId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, is_active")
    .eq("clinic_id", clinicId)
    .eq("id", supplierId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Fornecedor não encontrado.");
  if (!data.is_active) {
    throw new Error("Fornecedor inativo não pode ser vinculado.");
  }
}

function revalidateFornecedoresPaths() {
  revalidatePath("/fornecedores");
  revalidatePath("/estoque");
}

export async function listSuppliers(): Promise<SupplierRow[]> {
  if (isDemoMockDataEnabled()) return [];

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as SupplierRow[];
}

export async function createSupplier(
  input: SupplierFormInput,
): Promise<SupplierRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Fornecedores disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      clinic_id: clinicId,
      name: assertSupplierName(input.name),
      phone: assertSupplierPhone(input.phone),
      email: assertSupplierEmail(input.email),
      notes: input.notes?.trim() || null,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidateFornecedoresPaths();
  return data as SupplierRow;
}

export async function updateSupplier(
  id: string,
  input: SupplierFormInput,
): Promise<SupplierRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Fornecedores disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: assertSupplierName(input.name),
      phone: assertSupplierPhone(input.phone),
      email: assertSupplierEmail(input.email),
      notes: input.notes?.trim() || null,
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidateFornecedoresPaths();
  return data as SupplierRow;
}

export async function setSupplierActive(
  id: string,
  isActive: boolean,
): Promise<SupplierRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Fornecedores disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidateFornecedoresPaths();
  return data as SupplierRow;
}

type SupplyLinkQueryRow = {
  id: string;
  name: string;
  unit_label: string;
  preferred_supplier_id: string | null;
  suppliers: { name: string } | { name: string }[] | null;
};

function mapSupplyLinkRow(row: SupplyLinkQueryRow): SupplyLinkRow {
  const supplier = row.suppliers
    ? Array.isArray(row.suppliers)
      ? (row.suppliers[0] ?? null)
      : row.suppliers
    : null;

  return {
    id: row.id,
    name: row.name,
    unit_label: row.unit_label,
    preferred_supplier_id: row.preferred_supplier_id,
    preferred_supplier_name: supplier?.name ?? null,
  };
}

export async function listSuppliesForLinking(): Promise<SupplyLinkRow[]> {
  if (isDemoMockDataEnabled()) return [];

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select(
      `
        id,
        name,
        unit_label,
        preferred_supplier_id,
        suppliers!supplies_preferred_supplier_id_fkey (name)
      `,
    )
    .eq("clinic_id", clinicId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) =>
    mapSupplyLinkRow(row as SupplyLinkQueryRow),
  );
}

export async function updateSupplyPreferredSupplier(
  supplyId: string,
  preferredSupplierId: string | null,
): Promise<void> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Fornecedores disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  await requireSupplyInClinic(supplyId, clinicId);

  if (preferredSupplierId) {
    await requireActiveSupplierInClinic(preferredSupplierId, clinicId);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("supplies")
    .update({
      preferred_supplier_id: preferredSupplierId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", supplyId)
    .eq("clinic_id", clinicId);

  if (error) throw new Error(error.message);

  revalidateFornecedoresPaths();
}
