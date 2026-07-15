import type { AppointmentStatus } from "@/lib/supabase/types";
import { getAuthContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";

export type AutoFinanceEntryDraft = {
  entry_type: "revenue" | "variable_cost";
  amount_cents: number;
  description: string;
};

export type AutoFinanceReversalDraft = {
  entry_type: "revenue_reversal" | "variable_cost_reversal";
  amount_cents: number;
  description: string;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function shouldApplyAutoFinance(input: {
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  financeModuleEnabled: boolean;
  alreadyApplied: boolean;
}): boolean {
  return (
    input.financeModuleEnabled &&
    input.previousStatus !== "completed" &&
    input.newStatus === "completed" &&
    !input.alreadyApplied
  );
}

export function shouldApplyAutoFinanceReversal(input: {
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  financeModuleEnabled: boolean;
  alreadyApplied: boolean;
}): boolean {
  return (
    input.financeModuleEnabled &&
    input.previousStatus === "completed" &&
    input.newStatus !== "completed" &&
    input.alreadyApplied
  );
}

export function buildRevenueEntryDraft(input: {
  procedureName: string;
  basePriceCents: number;
}): AutoFinanceEntryDraft {
  return {
    entry_type: "revenue",
    amount_cents: input.basePriceCents,
    description: input.procedureName,
  };
}

export function buildVariableCostDrafts(
  bomItems: Array<{
    supply_name: string;
    quantity: number;
    unit_cost_cents: number | null;
  }>,
): AutoFinanceEntryDraft[] {
  return bomItems
    .filter((item) => item.unit_cost_cents != null)
    .map((item) => ({
      entry_type: "variable_cost" as const,
      amount_cents: -Math.round(item.quantity * item.unit_cost_cents!),
      description: item.supply_name,
    }));
}

export function buildReversalDrafts(
  autoEntries: AutoFinanceEntryDraft[],
): AutoFinanceReversalDraft[] {
  return autoEntries.map((entry) => {
    if (entry.entry_type === "revenue") {
      return {
        entry_type: "revenue_reversal" as const,
        amount_cents: -entry.amount_cents,
        description: entry.description,
      };
    }
    return {
      entry_type: "variable_cost_reversal" as const,
      amount_cents: -entry.amount_cents,
      description: entry.description,
    };
  });
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function applyFinanceForAppointmentStatusChange(
  appointmentId: string,
  previousStatus: AppointmentStatus,
  newStatus: AppointmentStatus,
  options?: { revenueAmountCents?: number | null },
): Promise<{ applied: boolean; reversed: boolean }> {
  const ctx = await getAuthContext();
  if (!ctx?.clinic || !ctx.profile.clinic_id) {
    return { applied: false, reversed: false };
  }

  const financeModuleEnabled = ctx.enabledModules.includes("financeiro");
  if (!financeModuleEnabled) {
    return { applied: false, reversed: false };
  }

  const clinicId = ctx.profile.clinic_id;
  const supabase = await createClient();

  const { data: appliedRow, error: appliedError } = await supabase
    .from("appointment_finance_applied")
    .select("reversed_at")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  if (appliedError) throw new Error(appliedError.message);

  const alreadyApplied =
    appliedRow != null && appliedRow.reversed_at == null;

  if (
    shouldApplyAutoFinanceReversal({
      previousStatus,
      newStatus,
      alreadyApplied,
      financeModuleEnabled,
    })
  ) {
    const { data: autoEntries, error: entriesError } = await supabase
      .from("financial_entries")
      .select("entry_type, amount_cents, description")
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", clinicId)
      .eq("source", "auto")
      .in("entry_type", ["revenue", "variable_cost"]);

    if (entriesError) throw new Error(entriesError.message);
    if (!autoEntries?.length) {
      return { applied: false, reversed: false };
    }

    const reversals = buildReversalDrafts(
      autoEntries as AutoFinanceEntryDraft[],
    );

    for (const reversal of reversals) {
      const { error: insertError } = await supabase
        .from("financial_entries")
        .insert({
          clinic_id: clinicId,
          entry_type: reversal.entry_type,
          source: "auto",
          amount_cents: reversal.amount_cents,
          appointment_id: appointmentId,
          description: reversal.description,
          entry_date: todayDateString(),
          created_by: ctx.userId,
        });

      if (insertError) throw new Error(insertError.message);
    }

    const { error: reverseError } = await supabase
      .from("appointment_finance_applied")
      .update({ reversed_at: new Date().toISOString() })
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", clinicId);

    if (reverseError) throw new Error(reverseError.message);

    return { applied: false, reversed: true };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("procedure_id, dentist_id, payment_source, procedure_label")
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (appointmentError) throw new Error(appointmentError.message);
  if (!appointment) {
    return { applied: false, reversed: false };
  }

  // Convênio: a receita não é reconhecida na conclusão. Uma guia é criada e a
  // receita entra no ledger apenas quando a guia é marcada como paga.
  if (appointment.payment_source === "insurance") {
    return { applied: false, reversed: false };
  }

  if (
    !shouldApplyAutoFinance({
      previousStatus,
      newStatus,
      alreadyApplied,
      financeModuleEnabled,
    })
  ) {
    return { applied: false, reversed: false };
  }

  const procedureId = appointment.procedure_id ?? null;
  const dentistId = appointment.dentist_id ?? null;
  const drafts: AutoFinanceEntryDraft[] = [];
  const overrideCents = options?.revenueAmountCents;

  if (procedureId) {
    const { data: procedure, error: procedureError } = await supabase
      .from("procedures")
      .select("name, base_price_cents")
      .eq("id", procedureId)
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (procedureError) throw new Error(procedureError.message);
    if (procedure) {
      drafts.push(
        buildRevenueEntryDraft({
          procedureName: procedure.name,
          basePriceCents:
            overrideCents != null && overrideCents >= 0
              ? overrideCents
              : procedure.base_price_cents,
        }),
      );
    }

    const { data: bomRows, error: bomError } = await supabase
      .from("procedure_supply_items")
      .select("quantity, supplies(name, unit_cost_cents)")
      .eq("clinic_id", clinicId)
      .eq("procedure_id", procedureId);

    if (bomError) throw new Error(bomError.message);

    const bomItems = (bomRows ?? []).map((row) => {
      const supply = firstRelation(
        row.supplies as
          | { name: string; unit_cost_cents: number | null }
          | { name: string; unit_cost_cents: number | null }[]
          | null,
      );
      return {
        supply_name: supply?.name ?? "Insumo",
        quantity: Number(row.quantity),
        unit_cost_cents: supply?.unit_cost_cents ?? null,
      };
    });

    drafts.push(...buildVariableCostDrafts(bomItems));
  } else if (overrideCents != null && overrideCents >= 0) {
    drafts.push(
      buildRevenueEntryDraft({
        procedureName: appointment.procedure_label || "Consulta",
        basePriceCents: overrideCents,
      }),
    );
  }

  if (drafts.length === 0) {
    return { applied: false, reversed: false };
  }

  const entryDate = todayDateString();

  for (const draft of drafts) {
    const { error: insertError } = await supabase
      .from("financial_entries")
      .insert({
        clinic_id: clinicId,
        entry_type: draft.entry_type,
        source: "auto",
        amount_cents: draft.amount_cents,
        appointment_id: appointmentId,
        procedure_id: draft.entry_type === "revenue" ? procedureId : null,
        dentist_id: draft.entry_type === "revenue" ? dentistId : null,
        description: draft.description,
        entry_date: entryDate,
        created_by: ctx.userId,
      });

    if (insertError) throw new Error(insertError.message);
  }

  const { error: insertAppliedError } = await supabase
    .from("appointment_finance_applied")
    .insert({
      appointment_id: appointmentId,
      clinic_id: clinicId,
    });

  if (insertAppliedError) throw new Error(insertAppliedError.message);

  return { applied: true, reversed: false };
}
