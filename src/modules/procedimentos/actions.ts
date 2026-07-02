"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";
import {
  assertBomQuantity,
  assertCatalogName,
  assertDurationMin,
  assertPriceCents,
} from "./validation";
import type {
  ProcedureBomRow,
  ProcedureFormInput,
  ProcedureRow,
  SupplyFormInput,
  SupplyRow,
} from "./types";

async function requireProcedimentosModule() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Sessão inválida.");
  if (!ctx.enabledModules.includes("procedimentos")) {
    throw new Error("Módulo Procedimentos não está ativo para esta clínica.");
  }
  return ctx;
}

async function assertWritableAdmin() {
  const ctx = await requireProcedimentosModule();
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Apenas o administrador pode alterar o catálogo.");
  }
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
  return ctx;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type BomItemRow = {
  id: string;
  clinic_id: string;
  procedure_id: string;
  supply_id: string;
  quantity: number;
  supplies: SupplyRow | SupplyRow[] | null;
};

function mapBomRow(row: BomItemRow): ProcedureBomRow {
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    procedure_id: row.procedure_id,
    supply_id: row.supply_id,
    quantity: Number(row.quantity),
    supply: firstRelation(row.supplies),
  };
}

async function requireProcedureInClinic(procedureId: string, clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("id", procedureId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Procedimento não encontrado.");
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

export async function listProcedures(options?: {
  activeOnly?: boolean;
}): Promise<ProcedureRow[]> {
  if (isDemoMockDataEnabled()) return [];

  await requireProcedimentosModule();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  let query = supabase
    .from("procedures")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProcedureRow[];
}

export async function listSupplies(options?: {
  activeOnly?: boolean;
}): Promise<SupplyRow[]> {
  if (isDemoMockDataEnabled()) return [];

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  let query = supabase
    .from("supplies")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as SupplyRow[];
}

export async function createProcedure(
  input: ProcedureFormInput,
): Promise<ProcedureRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .insert({
      clinic_id: clinicId,
      name: assertCatalogName(input.name),
      base_price_cents: assertPriceCents(input.base_price_cents),
      default_duration_min: assertDurationMin(input.default_duration_min),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
  revalidatePath("/agenda");
  return data as ProcedureRow;
}

export async function updateProcedure(
  id: string,
  input: ProcedureFormInput,
): Promise<ProcedureRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .update({
      name: assertCatalogName(input.name),
      base_price_cents: assertPriceCents(input.base_price_cents),
      default_duration_min: assertDurationMin(input.default_duration_min),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
  revalidatePath("/agenda");
  return data as ProcedureRow;
}

export async function setProcedureActive(
  id: string,
  isActive: boolean,
): Promise<ProcedureRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedures")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
  revalidatePath("/agenda");
  return data as ProcedureRow;
}

export async function createSupply(input: SupplyFormInput): Promise<SupplyRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const unitCostCents =
    input.unit_cost_cents === undefined || input.unit_cost_cents === null
      ? null
      : assertPriceCents(input.unit_cost_cents);

  const { data, error } = await supabase
    .from("supplies")
    .insert({
      clinic_id: clinicId,
      name: assertCatalogName(input.name),
      unit_label: input.unit_label?.trim() || "un",
      unit_cost_cents: unitCostCents,
      sku: input.sku?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
  return data as SupplyRow;
}

export async function updateSupply(
  id: string,
  input: SupplyFormInput,
): Promise<SupplyRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const unitCostCents =
    input.unit_cost_cents === undefined || input.unit_cost_cents === null
      ? null
      : assertPriceCents(input.unit_cost_cents);

  const { data, error } = await supabase
    .from("supplies")
    .update({
      name: assertCatalogName(input.name),
      unit_label: input.unit_label?.trim() || "un",
      unit_cost_cents: unitCostCents,
      sku: input.sku?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
  return data as SupplyRow;
}

export async function setSupplyActive(
  id: string,
  isActive: boolean,
): Promise<SupplyRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
  return data as SupplyRow;
}

export async function listProcedureBom(
  procedureId: string,
): Promise<ProcedureBomRow[]> {
  if (isDemoMockDataEnabled()) return [];

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  await requireProcedureInClinic(procedureId, clinicId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedure_supply_items")
    .select(
      `
        id,
        clinic_id,
        procedure_id,
        supply_id,
        quantity,
        supplies (*)
      `,
    )
    .eq("clinic_id", clinicId)
    .eq("procedure_id", procedureId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapBomRow(row as BomItemRow));
}

export async function upsertProcedureBomItem(input: {
  procedureId: string;
  supplyId: string;
  quantity: number;
}): Promise<ProcedureBomRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  await requireProcedureInClinic(input.procedureId, clinicId);
  await requireSupplyInClinic(input.supplyId, clinicId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procedure_supply_items")
    .upsert(
      {
        clinic_id: clinicId,
        procedure_id: input.procedureId,
        supply_id: input.supplyId,
        quantity: assertBomQuantity(input.quantity),
      },
      { onConflict: "procedure_id,supply_id" },
    )
    .select(
      `
        id,
        clinic_id,
        procedure_id,
        supply_id,
        quantity,
        supplies (*)
      `,
    )
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
  return mapBomRow(data as BomItemRow);
}

export async function removeProcedureBomItem(itemId: string): Promise<void> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Catálogo disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("procedure_supply_items")
    .delete()
    .eq("id", itemId)
    .eq("clinic_id", clinicId);

  if (error) throw new Error(error.message);
  revalidatePath("/procedimentos");
}
