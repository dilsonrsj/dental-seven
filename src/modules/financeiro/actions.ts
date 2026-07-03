"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, requireClinicId, assertClinicContext } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";
import { computeMonthSummary } from "./month-summary";
import type {
  ClinicMonthlySettingsRow,
  FinancialEntryRow,
  FinancialEntryType,
  ManualEntryFormInput,
  MonthSummary,
} from "./types";
import {
  assertAmountCents,
  assertEntryDescription,
  assertYearMonth,
  toExpenseAmountCents,
} from "./validation";

const REVENUE_ENTRY_TYPES: FinancialEntryType[] = [
  "revenue",
  "revenue_reversal",
  "manual_revenue",
];

const ZERO_MONTH_SUMMARY: MonthSummary = {
  revenueCents: 0,
  variableCostCents: 0,
  fixedCostsCents: 0,
  marginCents: 0,
};

function yearMonthBounds(yearMonth: string): { start: string; end: string } {
  const [y, m] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapFinancialEntryRow(row: Record<string, unknown>): FinancialEntryRow {
  return {
    ...(row as FinancialEntryRow),
    amount_cents: Number(row.amount_cents),
  };
}

async function requireFinanceiroModule() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Sessão inválida.");
  if (!ctx.enabledModules.includes("financeiro")) {
    throw new Error("Módulo Financeiro não está ativo para esta clínica.");
  }
  return assertClinicContext(ctx);
}

async function assertWritableAdmin() {
  const ctx = await requireFinanceiroModule();
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Apenas o administrador pode alterar lançamentos financeiros.");
  }
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
  return ctx;
}

async function loadFixedCostsCents(
  clinicId: string,
  yearMonth: string,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_monthly_settings")
    .select("fixed_costs_cents")
    .eq("clinic_id", clinicId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.fixed_costs_cents ?? 0;
}

export async function getMonthFinanceSummary(
  yearMonth: string,
): Promise<MonthSummary> {
  if (isDemoMockDataEnabled()) return ZERO_MONTH_SUMMARY;

  const ctx = await requireFinanceiroModule();
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Apenas o administrador pode ver o resumo financeiro completo.");
  }

  const validatedYearMonth = assertYearMonth(yearMonth);
  const clinicId = await requireClinicId();
  const { start, end } = yearMonthBounds(validatedYearMonth);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_entries")
    .select("entry_type, amount_cents")
    .eq("clinic_id", clinicId)
    .gte("entry_date", start)
    .lte("entry_date", end);

  if (error) throw new Error(error.message);

  const fixedCostsCents = await loadFixedCostsCents(clinicId, validatedYearMonth);

  return computeMonthSummary({
    entries: (data ?? []).map((row) => ({
      entry_type: row.entry_type as FinancialEntryType,
      amount_cents: Number(row.amount_cents),
    })),
    fixedCostsCents,
  });
}

export async function getDentistRevenueSummary(
  yearMonth: string,
): Promise<{ revenueCents: number }> {
  if (isDemoMockDataEnabled()) return { revenueCents: 0 };

  const ctx = await requireFinanceiroModule();
  if (ctx.profile.role !== "dentist") {
    throw new Error("Apenas dentistas podem ver o resumo de receita pessoal.");
  }
  if (!ctx.profile.dentist_id) {
    throw new Error("Perfil de dentista sem vínculo.");
  }

  const validatedYearMonth = assertYearMonth(yearMonth);
  const clinicId = await requireClinicId();
  const { start, end } = yearMonthBounds(validatedYearMonth);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_entries")
    .select("amount_cents")
    .eq("clinic_id", clinicId)
    .eq("dentist_id", ctx.profile.dentist_id)
    .in("entry_type", REVENUE_ENTRY_TYPES)
    .gte("entry_date", start)
    .lte("entry_date", end);

  if (error) throw new Error(error.message);

  const revenueCents = (data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_cents),
    0,
  );

  return { revenueCents };
}

export async function listFinancialEntries(
  yearMonth: string,
  limit = 30,
): Promise<FinancialEntryRow[]> {
  if (isDemoMockDataEnabled()) return [];

  const ctx = await requireFinanceiroModule();
  const validatedYearMonth = assertYearMonth(yearMonth);
  const clinicId = await requireClinicId();
  const { start, end } = yearMonthBounds(validatedYearMonth);
  const supabase = await createClient();

  let query = supabase
    .from("financial_entries")
    .select("*")
    .eq("clinic_id", clinicId)
    .gte("entry_date", start)
    .lte("entry_date", end)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ctx.profile.role === "dentist") {
    if (!ctx.profile.dentist_id) {
      throw new Error("Perfil de dentista sem vínculo.");
    }
    query = query
      .eq("dentist_id", ctx.profile.dentist_id)
      .in("entry_type", REVENUE_ENTRY_TYPES);
  } else if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Sem permissão para listar lançamentos financeiros.");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    mapFinancialEntryRow(row as Record<string, unknown>),
  );
}

export async function createManualEntry(
  input: ManualEntryFormInput,
): Promise<FinancialEntryRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Financeiro disponível com Supabase configurado.");
  }

  const ctx = await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const description = assertEntryDescription(input.description);
  const entryDate = input.entryDate?.trim() || todayDateString();

  const entryType: FinancialEntryType =
    input.kind === "revenue" ? "manual_revenue" : "manual_expense";
  const amountCents =
    input.kind === "revenue"
      ? assertAmountCents(input.amountCents)
      : toExpenseAmountCents(input.amountCents);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financial_entries")
    .insert({
      clinic_id: clinicId,
      entry_type: entryType,
      source: "manual",
      amount_cents: amountCents,
      appointment_id: null,
      procedure_id: null,
      dentist_id: null,
      description,
      entry_date: entryDate,
      created_by: ctx.userId,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/financeiro");

  return mapFinancialEntryRow(data as Record<string, unknown>);
}

export async function updateMonthlyFixedCosts(
  yearMonth: string,
  fixedCostsCents: number,
): Promise<ClinicMonthlySettingsRow> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Financeiro disponível com Supabase configurado.");
  }

  await assertWritableAdmin();
  const clinicId = await requireClinicId();
  const validatedYearMonth = assertYearMonth(yearMonth);

  if (!Number.isInteger(fixedCostsCents) || fixedCostsCents < 0) {
    throw new Error("Custos fixos devem ser um inteiro maior ou igual a zero.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_monthly_settings")
    .upsert(
      {
        clinic_id: clinicId,
        year_month: validatedYearMonth,
        fixed_costs_cents: fixedCostsCents,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clinic_id,year_month" },
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/financeiro");

  return {
    ...(data as ClinicMonthlySettingsRow),
    fixed_costs_cents: Number(data.fixed_costs_cents),
  };
}
