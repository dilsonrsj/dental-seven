"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";
import { applySupplyMovement } from "./appointment-stock";
import { getStockAlertLevel, isStockAlert } from "./stock-level";
import type {
  PreferredSupplierRef,
  StockMovementFormInput,
  StockMovementRow,
  StockSupplyRow,
} from "./types";
import {
  assertAdjustmentDelta,
  assertMinQuantity,
  movementQuantityForType,
} from "./validation";

async function requireEstoqueModule() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Sessão inválida.");
  if (!ctx.enabledModules.includes("estoque")) {
    throw new Error("Módulo Estoque não está ativo para esta clínica.");
  }
  return ctx;
}

async function assertWritableAdmin() {
  const ctx = await requireEstoqueModule();
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Apenas o administrador pode movimentar o estoque.");
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

type SupplyQueryRow = Record<string, unknown> & {
  preferred_supplier?:
    | PreferredSupplierRef
    | PreferredSupplierRef[]
    | null;
};

function mapPreferredSupplier(
  value: SupplyQueryRow["preferred_supplier"],
): PreferredSupplierRef | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function mapStockSupplyRow(row: SupplyQueryRow): StockSupplyRow {
  const quantityOnHand = Number(row.quantity_on_hand ?? 0);
  const minQuantity =
    row.min_quantity == null ? null : Number(row.min_quantity);
  const alertLevel = getStockAlertLevel({
    quantity_on_hand: quantityOnHand,
    min_quantity: minQuantity,
  });

  const { preferred_supplier: preferredSupplierRaw, ...supplyRow } = row;

  return {
    ...(supplyRow as Omit<StockSupplyRow, "alert_level" | "preferred_supplier">),
    quantity_on_hand: quantityOnHand,
    min_quantity: minQuantity,
    alert_level: alertLevel,
    preferred_supplier: mapPreferredSupplier(preferredSupplierRaw),
  };
}

export async function listStockSupplies(): Promise<StockSupplyRow[]> {
  if (isDemoMockDataEnabled()) return [];

  const ctx = await requireEstoqueModule();
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const fornecedoresEnabled = ctx.enabledModules.includes("fornecedores");
  const selectQuery = fornecedoresEnabled
    ? `*, preferred_supplier:suppliers!supplies_preferred_supplier_id_fkey(id, name, phone, email)`
    : "*";

  const { data, error } = await supabase
    .from("supplies")
    .select(selectQuery)
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapStockSupplyRow(row as SupplyQueryRow));
}

export async function countStockAlerts(): Promise<number> {
  if (isDemoMockDataEnabled()) return 0;

  const supplies = await listStockSupplies();
  return supplies.filter((supply) => isStockAlert(supply.alert_level)).length;
}

export async function listSupplyMovements(
  supplyId: string,
  limit = 20,
): Promise<StockMovementRow[]> {
  if (isDemoMockDataEnabled()) return [];

  await requireEstoqueModule();
  const clinicId = await requireClinicId();
  await requireSupplyInClinic(supplyId, clinicId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("supply_id", supplyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    quantity: Number(row.quantity),
    quantity_after: Number(row.quantity_after),
  })) as StockMovementRow[];
}

export async function recordStockMovement(
  input: StockMovementFormInput,
): Promise<StockMovementRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Estoque disponível com Supabase configurado.");
  }

  const ctx = await assertWritableAdmin();
  const clinicId = await requireClinicId();
  await requireSupplyInClinic(input.supplyId, clinicId);

  const quantity =
    input.type === "adjustment"
      ? assertAdjustmentDelta(input.quantity)
      : movementQuantityForType(input.type, input.quantity);

  const supabase = await createClient();
  const quantityAfter = await applySupplyMovement(supabase, {
    clinicId,
    supplyId: input.supplyId,
    movementType: input.type,
    quantity,
    notes: input.notes?.trim() || null,
    createdBy: ctx.userId,
  });

  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("supply_id", input.supplyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/estoque");

  return {
    ...data,
    quantity: Number(data.quantity),
    quantity_after: quantityAfter,
  } as StockMovementRow;
}

export async function updateSupplyMinQuantity(
  supplyId: string,
  minQuantity: number | null,
): Promise<StockSupplyRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Estoque disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  await requireSupplyInClinic(supplyId, clinicId);

  const validatedMin = assertMinQuantity(minQuantity);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .update({
      min_quantity: validatedMin,
      updated_at: new Date().toISOString(),
    })
    .eq("id", supplyId)
    .eq("clinic_id", clinicId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const quantityOnHand = Number(data.quantity_on_hand ?? 0);
  const minQty = data.min_quantity == null ? null : Number(data.min_quantity);
  const alertLevel = getStockAlertLevel({
    quantity_on_hand: quantityOnHand,
    min_quantity: minQty,
  });

  revalidatePath("/estoque");

  return {
    ...(data as Omit<StockSupplyRow, "alert_level" | "preferred_supplier">),
    quantity_on_hand: quantityOnHand,
    min_quantity: minQty,
    alert_level: alertLevel,
    preferred_supplier: null,
  };
}
