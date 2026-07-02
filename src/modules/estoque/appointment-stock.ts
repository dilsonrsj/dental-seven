import type { AppointmentStatus } from "@/lib/supabase/types";
import { getAuthContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import type {
  BomItemRef,
  DeductionMovementDraft,
  ReversalMovementDraft,
  StockMovementType,
} from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export function shouldApplyAutoDeduction(input: {
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  procedureId: string | null;
  bomItems: BomItemRef[];
  alreadyApplied: boolean;
  estoqueModuleEnabled: boolean;
}): boolean {
  return (
    input.estoqueModuleEnabled &&
    input.previousStatus !== "completed" &&
    input.newStatus === "completed" &&
    input.procedureId != null &&
    input.bomItems.length > 0 &&
    !input.alreadyApplied
  );
}

export function shouldApplyAutoReversal(input: {
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  alreadyApplied: boolean;
  estoqueModuleEnabled: boolean;
}): boolean {
  return (
    input.estoqueModuleEnabled &&
    input.previousStatus === "completed" &&
    input.newStatus !== "completed" &&
    input.alreadyApplied
  );
}

export function buildDeductionMovements(
  _appointmentId: string,
  bomItems: BomItemRef[],
): DeductionMovementDraft[] {
  return bomItems.map((item) => ({
    supply_id: item.supply_id,
    quantity: -item.quantity,
    movement_type: "auto_deduction" as const,
  }));
}

export function buildReversalMovements(
  _appointmentId: string,
  deductions: Pick<DeductionMovementDraft, "supply_id" | "quantity">[],
): ReversalMovementDraft[] {
  return deductions.map((item) => ({
    supply_id: item.supply_id,
    quantity: -item.quantity,
    movement_type: "auto_reversal" as const,
  }));
}

export async function applySupplyMovement(
  supabase: SupabaseServerClient,
  opts: {
    clinicId: string;
    supplyId: string;
    movementType: StockMovementType;
    quantity: number;
    appointmentId?: string | null;
    notes?: string | null;
    createdBy?: string | null;
  },
): Promise<number> {
  const { data: supply, error: fetchError } = await supabase
    .from("supplies")
    .select("quantity_on_hand")
    .eq("id", opts.supplyId)
    .eq("clinic_id", opts.clinicId)
    .single();

  if (fetchError || !supply) {
    throw new Error("Insumo não encontrado.");
  }

  const current = Number(supply.quantity_on_hand);
  const quantityAfter = Math.round((current + opts.quantity) * 1000) / 1000;

  const { error: updateError } = await supabase
    .from("supplies")
    .update({
      quantity_on_hand: quantityAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.supplyId)
    .eq("clinic_id", opts.clinicId);

  if (updateError) throw new Error(updateError.message);

  const { error: insertError } = await supabase.from("stock_movements").insert({
    clinic_id: opts.clinicId,
    supply_id: opts.supplyId,
    movement_type: opts.movementType,
    quantity: opts.quantity,
    quantity_after: quantityAfter,
    appointment_id: opts.appointmentId ?? null,
    notes: opts.notes ?? null,
    created_by: opts.createdBy ?? null,
  });

  if (insertError) throw new Error(insertError.message);

  return quantityAfter;
}

export async function applyStockForAppointmentStatusChange(
  appointmentId: string,
  previousStatus: AppointmentStatus,
  newStatus: AppointmentStatus,
): Promise<{ applied: boolean; reversed: boolean }> {
  const ctx = await getAuthContext();
  if (!ctx?.clinic || !ctx.profile.clinic_id) {
    return { applied: false, reversed: false };
  }

  const estoqueModuleEnabled = ctx.enabledModules.includes("estoque");
  if (!estoqueModuleEnabled) {
    return { applied: false, reversed: false };
  }

  const clinicId = ctx.profile.clinic_id;
  const supabase = await createClient();

  const { data: appliedRow, error: appliedError } = await supabase
    .from("appointment_stock_applied")
    .select("reversed_at")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (appliedError) throw new Error(appliedError.message);

  const alreadyApplied =
    appliedRow != null && appliedRow.reversed_at == null;

  if (
    shouldApplyAutoReversal({
      previousStatus,
      newStatus,
      alreadyApplied,
      estoqueModuleEnabled,
    })
  ) {
    const { data: deductions, error: deductionsError } = await supabase
      .from("stock_movements")
      .select("supply_id, quantity")
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", clinicId)
      .eq("movement_type", "auto_deduction");

    if (deductionsError) throw new Error(deductionsError.message);
    if (!deductions?.length) {
      return { applied: false, reversed: false };
    }

    const movements = buildReversalMovements(appointmentId, deductions);

    for (const movement of movements) {
      await applySupplyMovement(supabase, {
        clinicId,
        supplyId: movement.supply_id,
        movementType: movement.movement_type,
        quantity: movement.quantity,
        appointmentId,
        createdBy: ctx.userId,
      });
    }

    const { error: reverseError } = await supabase
      .from("appointment_stock_applied")
      .update({ reversed_at: new Date().toISOString() })
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", clinicId);

    if (reverseError) throw new Error(reverseError.message);

    return { applied: false, reversed: true };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("procedure_id")
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (appointmentError) throw new Error(appointmentError.message);
  if (!appointment) {
    return { applied: false, reversed: false };
  }

  const procedureId = appointment.procedure_id ?? null;

  let bomItems: BomItemRef[] = [];
  if (procedureId) {
    const { data: bomRows, error: bomError } = await supabase
      .from("procedure_supply_items")
      .select("supply_id, quantity")
      .eq("clinic_id", clinicId)
      .eq("procedure_id", procedureId);

    if (bomError) throw new Error(bomError.message);
    bomItems = (bomRows ?? []).map((row) => ({
      supply_id: row.supply_id,
      quantity: Number(row.quantity),
    }));
  }

  if (
    !shouldApplyAutoDeduction({
      previousStatus,
      newStatus,
      procedureId,
      bomItems,
      alreadyApplied,
      estoqueModuleEnabled,
    })
  ) {
    return { applied: false, reversed: false };
  }

  const movements = buildDeductionMovements(appointmentId, bomItems);

  for (const movement of movements) {
    await applySupplyMovement(supabase, {
      clinicId,
      supplyId: movement.supply_id,
      movementType: movement.movement_type,
      quantity: movement.quantity,
      appointmentId,
      createdBy: ctx.userId,
    });
  }

  const { error: insertAppliedError } = await supabase
    .from("appointment_stock_applied")
    .insert({
      appointment_id: appointmentId,
      clinic_id: clinicId,
    });

  if (insertAppliedError) throw new Error(insertAppliedError.message);

  return { applied: true, reversed: false };
}
