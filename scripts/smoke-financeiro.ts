/**
 * Smoke v5 — financeiro (ledger + receita/custo automático)
 * Uso: npx tsx scripts/smoke-financeiro.ts
 */
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { resolve } from "path";
import JSZip from "jszip";
import { createClient } from "@supabase/supabase-js";
import { buildClinicExport } from "../src/lib/export/build-clinic-export";
import {
  buildReversalDrafts,
  buildRevenueEntryDraft,
  buildVariableCostDrafts,
  shouldApplyAutoFinance,
  shouldApplyAutoFinanceReversal,
  type AutoFinanceEntryDraft,
} from "../src/modules/financeiro/appointment-finance";
import type { AppointmentStatus } from "../src/lib/supabase/types";

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";
const PATIENT_ID = "786f4632-35c1-4f4a-882f-26e4c5ac87c8";
const EMAIL = "v2smoke-full-20260702@test.dr7.app";
const PASSWORD = "demo2026v2";
const PROCEDURE_NAME = "Limpeza Smoke v5 Financeiro";
const SUPPLY_NAME = "Luva Smoke v5 Financeiro";
const BASE_PRICE_CENTS = 14990;
const UNIT_COST_CENTS = 500;
const BOM_QTY = 2;
const EXPECTED_VARIABLE_COST = -(BOM_QTY * UNIT_COST_CENTS);
const MANUAL_REVENUE_CENTS = 25000;
const FIXED_COSTS_CENTS = 150000;

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

async function ensureModuleEnabled(
  admin: ReturnType<typeof createClient>,
  moduleKey: string,
) {
  type ClinicModuleRow = { enabled: boolean };
  const { data: row, error: fetchError } = await admin
    .from("clinic_modules")
    .select("enabled")
    .eq("clinic_id", CLINIC_ID)
    .eq("module_key", moduleKey)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  const moduleRow = row as ClinicModuleRow | null;
  if (moduleRow?.enabled) {
    console.log(`OK módulo ${moduleKey} já habilitado`);
    return;
  }

  const { error: upsertError } = await admin.from("clinic_modules").upsert(
    {
      clinic_id: CLINIC_ID,
      module_key: moduleKey,
      enabled: true,
    },
    { onConflict: "clinic_id,module_key" },
  );

  if (upsertError) throw new Error(upsertError.message);
  console.log(`OK módulo ${moduleKey} habilitado via service role`);
}

async function applyFinanceTransition(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  appointmentId: string,
  previousStatus: AppointmentStatus,
  newStatus: AppointmentStatus,
): Promise<{ applied: boolean; reversed: boolean }> {
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
      financeModuleEnabled: true,
    })
  ) {
    const { data: autoEntries, error: entriesError } = await supabase
      .from("financial_entries")
      .select("entry_type, amount_cents, description")
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", CLINIC_ID)
      .eq("source", "auto")
      .in("entry_type", ["revenue", "variable_cost"]);

    if (entriesError) throw new Error(entriesError.message);
    if (!autoEntries?.length) {
      return { applied: false, reversed: false };
    }

    const reversals = buildReversalDrafts(
      autoEntries as AutoFinanceEntryDraft[],
    );
    const entryDate = todayDateString();

    for (const reversal of reversals) {
      const { error: insertError } = await supabase
        .from("financial_entries")
        .insert({
          clinic_id: CLINIC_ID,
          entry_type: reversal.entry_type,
          source: "auto",
          amount_cents: reversal.amount_cents,
          appointment_id: appointmentId,
          description: reversal.description,
          entry_date: entryDate,
          created_by: userId,
        });

      if (insertError) throw new Error(insertError.message);
    }

    const { error: reverseError } = await supabase
      .from("appointment_finance_applied")
      .update({ reversed_at: new Date().toISOString() })
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", CLINIC_ID);

    if (reverseError) throw new Error(reverseError.message);

    return { applied: false, reversed: true };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("procedure_id, dentist_id")
    .eq("id", appointmentId)
    .eq("clinic_id", CLINIC_ID)
    .maybeSingle();

  if (appointmentError) throw new Error(appointmentError.message);
  if (!appointment) {
    return { applied: false, reversed: false };
  }

  if (
    !shouldApplyAutoFinance({
      previousStatus,
      newStatus,
      alreadyApplied,
      financeModuleEnabled: true,
    })
  ) {
    return { applied: false, reversed: false };
  }

  const procedureId = appointment.procedure_id ?? null;
  const dentistId = appointment.dentist_id ?? null;
  const drafts: AutoFinanceEntryDraft[] = [];

  if (procedureId) {
    const { data: procedure, error: procedureError } = await supabase
      .from("procedures")
      .select("name, base_price_cents")
      .eq("id", procedureId)
      .eq("clinic_id", CLINIC_ID)
      .maybeSingle();

    if (procedureError) throw new Error(procedureError.message);
    if (procedure) {
      drafts.push(
        buildRevenueEntryDraft({
          procedureName: procedure.name,
          basePriceCents: procedure.base_price_cents,
        }),
      );
    }

    const { data: bomRows, error: bomError } = await supabase
      .from("procedure_supply_items")
      .select("quantity, supplies(name, unit_cost_cents)")
      .eq("clinic_id", CLINIC_ID)
      .eq("procedure_id", procedureId);

    if (bomError) throw new Error(bomError.message);

    const bomItems = (bomRows ?? []).map((row) => {
      const supply = row.supplies as {
        name: string;
        unit_cost_cents: number | null;
      } | null;
      return {
        supply_name: supply?.name ?? "Insumo",
        quantity: Number(row.quantity),
        unit_cost_cents: supply?.unit_cost_cents ?? null,
      };
    });

    drafts.push(...buildVariableCostDrafts(bomItems));
  }

  if (drafts.length === 0) {
    return { applied: false, reversed: false };
  }

  const entryDate = todayDateString();

  for (const draft of drafts) {
    const { error: insertError } = await supabase
      .from("financial_entries")
      .insert({
        clinic_id: CLINIC_ID,
        entry_type: draft.entry_type,
        source: "auto",
        amount_cents: draft.amount_cents,
        appointment_id: appointmentId,
        procedure_id: draft.entry_type === "revenue" ? procedureId : null,
        dentist_id: draft.entry_type === "revenue" ? dentistId : null,
        description: draft.description,
        entry_date: entryDate,
        created_by: userId,
      });

    if (insertError) throw new Error(insertError.message);
  }

  const { error: insertAppliedError } = await supabase
    .from("appointment_finance_applied")
    .insert({
      appointment_id: appointmentId,
      clinic_id: CLINIC_ID,
    });

  if (insertAppliedError) throw new Error(insertAppliedError.message);

  return { applied: true, reversed: false };
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !serviceKey) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL, ANON_KEY e SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, anon);
  const admin = createClient(url, serviceKey);

  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authError || !auth.user) {
    throw new Error(`Login falhou: ${authError?.message}`);
  }
  console.log("OK login", auth.user.email);

  await ensureModuleEnabled(admin, "procedimentos");
  await ensureModuleEnabled(admin, "financeiro");

  const procedureId = randomUUID();
  const supplyId = randomUUID();
  const bomId = randomUUID();
  const manualEntryId = randomUUID();
  const yearMonth = currentYearMonth();
  let appointmentId: string | null = null;
  let fixedCostsExisted = false;
  let previousFixedCosts: number | null = null;

  try {
    const { data: procedure, error: procedureError } = await supabase
      .from("procedures")
      .insert({
        id: procedureId,
        clinic_id: CLINIC_ID,
        name: PROCEDURE_NAME,
        base_price_cents: BASE_PRICE_CENTS,
        default_duration_min: 45,
        is_active: true,
      })
      .select("id, name, base_price_cents")
      .single();

    if (procedureError) {
      throw new Error(`Insert procedure falhou: ${procedureError.message}`);
    }
    console.log("OK procedure", procedure?.base_price_cents);

    const { data: supply, error: supplyError } = await supabase
      .from("supplies")
      .insert({
        id: supplyId,
        clinic_id: CLINIC_ID,
        name: SUPPLY_NAME,
        unit_label: "par",
        is_active: true,
        quantity_on_hand: 0,
        unit_cost_cents: UNIT_COST_CENTS,
      })
      .select("id, name, unit_cost_cents")
      .single();

    if (supplyError) throw new Error(`Insert supply falhou: ${supplyError.message}`);
    console.log("OK supply unit_cost_cents", supply?.unit_cost_cents);

    const { data: bom, error: bomError } = await supabase
      .from("procedure_supply_items")
      .insert({
        id: bomId,
        clinic_id: CLINIC_ID,
        procedure_id: procedureId,
        supply_id: supplyId,
        quantity: BOM_QTY,
      })
      .select("id, quantity")
      .single();

    if (bomError) throw new Error(`Insert BOM falhou: ${bomError.message}`);
    console.log("OK BOM qty", bom?.quantity);

    const { data: dentist, error: dentistError } = await supabase
      .from("dentists")
      .select("id")
      .eq("clinic_id", CLINIC_ID)
      .eq("active", true)
      .limit(1)
      .single();

    if (dentistError || !dentist) {
      throw new Error(`Dentista smoke não encontrado: ${dentistError?.message}`);
    }

    const startsAt = new Date();
    startsAt.setUTCDate(startsAt.getUTCDate() + 22);
    startsAt.setUTCHours(17, 0, 0, 0);
    const endsAt = new Date(startsAt.getTime() + 45 * 60 * 1000);
    appointmentId = randomUUID();

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        id: appointmentId,
        clinic_id: CLINIC_ID,
        dentist_id: dentist.id,
        patient_id: PATIENT_ID,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        duration_min: 45,
        status: "pending",
        procedure_id: procedureId,
        procedure_label: PROCEDURE_NAME,
        notes: "Smoke v5 financeiro",
      })
      .select("id, status")
      .single();

    if (appointmentError) {
      throw new Error(`Insert appointment falhou: ${appointmentError.message}`);
    }
    console.log("OK appointment pending", appointment?.id);

    const { error: completeError } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", appointmentId)
      .eq("clinic_id", CLINIC_ID);

    if (completeError) throw new Error(completeError.message);

    const applyResult = await applyFinanceTransition(
      supabase,
      auth.user.id,
      appointmentId,
      "pending",
      "completed",
    );

    if (!applyResult.applied) {
      throw new Error("Financeiro automático não aplicado ao concluir consulta");
    }

    const { data: autoEntries, error: autoEntriesError } = await supabase
      .from("financial_entries")
      .select("entry_type, amount_cents, source")
      .eq("appointment_id", appointmentId)
      .eq("source", "auto")
      .in("entry_type", ["revenue", "variable_cost"]);

    if (autoEntriesError) throw new Error(autoEntriesError.message);

    const revenue = autoEntries?.find((e) => e.entry_type === "revenue");
    const variableCost = autoEntries?.find((e) => e.entry_type === "variable_cost");

    if (!revenue || Number(revenue.amount_cents) !== BASE_PRICE_CENTS) {
      throw new Error(
        `Receita inesperada: ${revenue?.amount_cents} (esperado ${BASE_PRICE_CENTS})`,
      );
    }
    if (!variableCost || Number(variableCost.amount_cents) !== EXPECTED_VARIABLE_COST) {
      throw new Error(
        `Custo variável inesperado: ${variableCost?.amount_cents} (esperado ${EXPECTED_VARIABLE_COST})`,
      );
    }
    console.log(
      "OK auto finance revenue",
      revenue.amount_cents,
      "variable_cost",
      variableCost.amount_cents,
    );

    const { error: reopenError } = await supabase
      .from("appointments")
      .update({ status: "pending" })
      .eq("id", appointmentId)
      .eq("clinic_id", CLINIC_ID);

    if (reopenError) throw new Error(reopenError.message);

    const reverseResult = await applyFinanceTransition(
      supabase,
      auth.user.id,
      appointmentId,
      "completed",
      "pending",
    );

    if (!reverseResult.reversed) {
      throw new Error("Estorno financeiro não aplicado ao reabrir consulta");
    }

    const { data: reversalEntries, error: reversalError } = await supabase
      .from("financial_entries")
      .select("entry_type, amount_cents")
      .eq("appointment_id", appointmentId)
      .eq("source", "auto")
      .in("entry_type", ["revenue_reversal", "variable_cost_reversal"]);

    if (reversalError) throw new Error(reversalError.message);
    if (!reversalEntries?.length || reversalEntries.length < 2) {
      throw new Error("Estornos financeiros incompletos");
    }

    const revenueReversal = reversalEntries.find(
      (e) => e.entry_type === "revenue_reversal",
    );
    const costReversal = reversalEntries.find(
      (e) => e.entry_type === "variable_cost_reversal",
    );

    if (!revenueReversal || Number(revenueReversal.amount_cents) !== -BASE_PRICE_CENTS) {
      throw new Error(
        `Estorno receita inesperado: ${revenueReversal?.amount_cents}`,
      );
    }
    if (!costReversal || Number(costReversal.amount_cents) !== -EXPECTED_VARIABLE_COST) {
      throw new Error(
        `Estorno custo inesperado: ${costReversal?.amount_cents}`,
      );
    }
    console.log("OK reversals", reversalEntries.length, "entrada(s)");

    const { data: existingSettings } = await admin
      .from("clinic_monthly_settings")
      .select("fixed_costs_cents")
      .eq("clinic_id", CLINIC_ID)
      .eq("year_month", yearMonth)
      .maybeSingle();

    if (existingSettings) {
      fixedCostsExisted = true;
      previousFixedCosts = Number(existingSettings.fixed_costs_cents);
    }

    const { data: manualEntry, error: manualError } = await supabase
      .from("financial_entries")
      .insert({
        id: manualEntryId,
        clinic_id: CLINIC_ID,
        entry_type: "manual_revenue",
        source: "manual",
        amount_cents: MANUAL_REVENUE_CENTS,
        description: "Smoke v5 receita manual",
        entry_date: todayDateString(),
        created_by: auth.user.id,
      })
      .select("id, entry_type, amount_cents")
      .single();

    if (manualError) throw new Error(`Manual revenue falhou: ${manualError.message}`);
    console.log("OK manual_revenue", manualEntry?.amount_cents);

    const { data: fixedCosts, error: fixedCostsError } = await supabase
      .from("clinic_monthly_settings")
      .upsert(
        {
          clinic_id: CLINIC_ID,
          year_month: yearMonth,
          fixed_costs_cents: FIXED_COSTS_CENTS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clinic_id,year_month" },
      )
      .select("year_month, fixed_costs_cents")
      .single();

    if (fixedCostsError) {
      throw new Error(`Fixed costs falhou: ${fixedCostsError.message}`);
    }
    if (Number(fixedCosts?.fixed_costs_cents) !== FIXED_COSTS_CENTS) {
      throw new Error(
        `Fixed costs inesperado: ${fixedCosts?.fixed_costs_cents}`,
      );
    }
    console.log("OK fixed_costs", fixedCosts?.fixed_costs_cents);

    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
    const { buffer, filename } = await buildClinicExport(CLINIC_ID);
    if (buffer.length < 100) throw new Error("ZIP export muito pequeno");

    const zip = await JSZip.loadAsync(buffer);
    const zipFiles = Object.keys(zip.files).filter((name) => !name.endsWith("/"));
    for (const required of [
      "financial_entries.json",
      "financial_entries.csv",
      "clinic_monthly_settings.json",
      "appointment_finance_applied.json",
    ]) {
      if (!zipFiles.includes(required)) {
        throw new Error(`Export ZIP sem ${required}`);
      }
    }

    const financialCsv =
      (await zip.file("financial_entries.csv")?.async("string")) ?? "";
    if (!financialCsv.includes("entry_type")) {
      throw new Error("financial_entries.csv sem coluna entry_type");
    }
    if (!financialCsv.includes("amount_cents")) {
      throw new Error("financial_entries.csv sem coluna amount_cents");
    }

    const manifest = JSON.parse(
      (await zip.file("manifest.json")?.async("string")) ?? "{}",
    );
    if (manifest.schemaVersion !== "1.6") {
      throw new Error(`schemaVersion inesperado: ${manifest.schemaVersion}`);
    }
    if (typeof manifest.counts?.financial_entries !== "number") {
      throw new Error("manifest sem counts.financial_entries");
    }
    if (typeof manifest.counts?.clinic_monthly_settings !== "number") {
      throw new Error("manifest sem counts.clinic_monthly_settings");
    }
    if (typeof manifest.counts?.appointment_finance_applied !== "number") {
      throw new Error("manifest sem counts.appointment_finance_applied");
    }

    console.log(
      "OK export LGPD",
      filename,
      buffer.length,
      "bytes",
      `| financial_entries: ${manifest.counts.financial_entries}`,
      `| clinic_monthly_settings: ${manifest.counts.clinic_monthly_settings}`,
      `| appointment_finance_applied: ${manifest.counts.appointment_finance_applied}`,
    );

    console.log("\nSMOKE_FINANCEIRO_OK");
  } finally {
    if (appointmentId) {
      await admin
        .from("financial_entries")
        .delete()
        .eq("appointment_id", appointmentId);
      await admin
        .from("appointment_finance_applied")
        .delete()
        .eq("appointment_id", appointmentId);
      await supabase.from("appointments").delete().eq("id", appointmentId);
    }
    await admin.from("financial_entries").delete().eq("id", manualEntryId);
    if (fixedCostsExisted && previousFixedCosts != null) {
      await admin.from("clinic_monthly_settings").upsert(
        {
          clinic_id: CLINIC_ID,
          year_month: yearMonth,
          fixed_costs_cents: previousFixedCosts,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "clinic_id,year_month" },
      );
    } else {
      await admin
        .from("clinic_monthly_settings")
        .delete()
        .eq("clinic_id", CLINIC_ID)
        .eq("year_month", yearMonth);
    }
    await supabase.from("procedure_supply_items").delete().eq("id", bomId);
    await supabase.from("procedures").delete().eq("id", procedureId);
    await supabase.from("supplies").delete().eq("id", supplyId);
    console.log("OK cleanup");
  }
}

main().catch((error) => {
  console.error("SMOKE_FINANCEIRO_FAIL", error);
  process.exit(1);
});
