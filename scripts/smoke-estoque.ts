/**
 * Smoke v4 — estoque (ledger + baixa/estorno automático)
 * Uso: npx tsx scripts/smoke-estoque.ts
 */
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { resolve } from "path";
import JSZip from "jszip";
import { createClient } from "@supabase/supabase-js";
import { buildClinicExport } from "../src/lib/export/build-clinic-export";
import {
  applySupplyMovement,
  buildDeductionMovements,
  buildReversalMovements,
  shouldApplyAutoDeduction,
  shouldApplyAutoReversal,
} from "../src/modules/estoque/appointment-stock";
import type { AppointmentStatus } from "../src/lib/supabase/types";

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";
const PATIENT_ID = "786f4632-35c1-4f4a-882f-26e4c5ac87c8";
const EMAIL = "v2smoke-full-20260702@test.dr7.app";
const PASSWORD = "demo2026v2";
const PROCEDURE_NAME = "Limpeza Smoke v4 Estoque";
const SUPPLY_NAME = "Luva Smoke v4 Estoque";
const INBOUND_QTY = 10;
const MIN_QTY = 5;
const BOM_QTY = 2;

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

async function applyStockTransition(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  appointmentId: string,
  previousStatus: AppointmentStatus,
  newStatus: AppointmentStatus,
): Promise<{ applied: boolean; reversed: boolean }> {
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
      estoqueModuleEnabled: true,
    })
  ) {
    const { data: deductions, error: deductionsError } = await supabase
      .from("stock_movements")
      .select("supply_id, quantity")
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", CLINIC_ID)
      .eq("movement_type", "auto_deduction");

    if (deductionsError) throw new Error(deductionsError.message);
    if (!deductions?.length) {
      return { applied: false, reversed: false };
    }

    const movements = buildReversalMovements(appointmentId, deductions);

    for (const movement of movements) {
      await applySupplyMovement(supabase, {
        clinicId: CLINIC_ID,
        supplyId: movement.supply_id,
        movementType: movement.movement_type,
        quantity: movement.quantity,
        appointmentId,
        createdBy: userId,
      });
    }

    const { error: reverseError } = await supabase
      .from("appointment_stock_applied")
      .update({ reversed_at: new Date().toISOString() })
      .eq("appointment_id", appointmentId)
      .eq("clinic_id", CLINIC_ID);

    if (reverseError) throw new Error(reverseError.message);

    return { applied: false, reversed: true };
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("procedure_id")
    .eq("id", appointmentId)
    .eq("clinic_id", CLINIC_ID)
    .maybeSingle();

  if (appointmentError) throw new Error(appointmentError.message);
  if (!appointment) {
    return { applied: false, reversed: false };
  }

  const procedureId = appointment.procedure_id ?? null;
  let bomItems: { supply_id: string; quantity: number }[] = [];

  if (procedureId) {
    const { data: bomRows, error: bomError } = await supabase
      .from("procedure_supply_items")
      .select("supply_id, quantity")
      .eq("clinic_id", CLINIC_ID)
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
      estoqueModuleEnabled: true,
    })
  ) {
    return { applied: false, reversed: false };
  }

  const movements = buildDeductionMovements(appointmentId, bomItems);

  for (const movement of movements) {
    await applySupplyMovement(supabase, {
      clinicId: CLINIC_ID,
      supplyId: movement.supply_id,
      movementType: movement.movement_type,
      quantity: movement.quantity,
      appointmentId,
      createdBy: userId,
    });
  }

  const { error: insertAppliedError } = await supabase
    .from("appointment_stock_applied")
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
  await ensureModuleEnabled(admin, "estoque");

  const procedureId = randomUUID();
  const supplyId = randomUUID();
  const bomId = randomUUID();
  let appointmentId: string | null = null;

  try {
    const { data: procedure, error: procedureError } = await supabase
      .from("procedures")
      .insert({
        id: procedureId,
        clinic_id: CLINIC_ID,
        name: PROCEDURE_NAME,
        base_price_cents: 14990,
        default_duration_min: 45,
        is_active: true,
      })
      .select("id, name")
      .single();

    if (procedureError) {
      throw new Error(`Insert procedure falhou: ${procedureError.message}`);
    }
    console.log("OK procedure", procedure);

    const { data: supply, error: supplyError } = await supabase
      .from("supplies")
      .insert({
        id: supplyId,
        clinic_id: CLINIC_ID,
        name: SUPPLY_NAME,
        unit_label: "par",
        is_active: true,
        quantity_on_hand: 0,
        min_quantity: MIN_QTY,
      })
      .select("id, name, min_quantity")
      .single();

    if (supplyError) throw new Error(`Insert supply falhou: ${supplyError.message}`);
    console.log("OK supply min_quantity", supply?.min_quantity);

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

    await applySupplyMovement(supabase, {
      clinicId: CLINIC_ID,
      supplyId,
      movementType: "inbound",
      quantity: INBOUND_QTY,
      notes: "Smoke v4 entrada manual",
      createdBy: auth.user.id,
    });

    const { data: supplyAfterInbound, error: supplyFetchError } = await supabase
      .from("supplies")
      .select("quantity_on_hand")
      .eq("id", supplyId)
      .single();

    if (supplyFetchError) throw new Error(supplyFetchError.message);
    if (Number(supplyAfterInbound?.quantity_on_hand) !== INBOUND_QTY) {
      throw new Error(
        `Saldo após entrada inesperado: ${supplyAfterInbound?.quantity_on_hand}`,
      );
    }
    console.log("OK inbound saldo", INBOUND_QTY);

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
    startsAt.setUTCDate(startsAt.getUTCDate() + 21);
    startsAt.setUTCHours(16, 0, 0, 0);
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
        notes: "Smoke v4 estoque",
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

    const deductResult = await applyStockTransition(
      supabase,
      auth.user.id,
      appointmentId,
      "pending",
      "completed",
    );

    if (!deductResult.applied) {
      throw new Error("auto_deduction não aplicada ao concluir consulta");
    }

    const { data: deductionMovements, error: deductionError } = await supabase
      .from("stock_movements")
      .select("movement_type, quantity")
      .eq("appointment_id", appointmentId)
      .eq("movement_type", "auto_deduction");

    if (deductionError) throw new Error(deductionError.message);
    if (!deductionMovements?.length) {
      throw new Error("Nenhum movimento auto_deduction encontrado");
    }
    console.log("OK auto_deduction", deductionMovements.length, "movimento(s)");

    const expectedAfterDeduction = INBOUND_QTY - BOM_QTY;
    const { data: supplyAfterDeduction, error: balanceError } = await supabase
      .from("supplies")
      .select("quantity_on_hand")
      .eq("id", supplyId)
      .single();

    if (balanceError) throw new Error(balanceError.message);
    if (Number(supplyAfterDeduction?.quantity_on_hand) !== expectedAfterDeduction) {
      throw new Error(
        `Saldo após baixa inesperado: ${supplyAfterDeduction?.quantity_on_hand}`,
      );
    }
    console.log("OK saldo após baixa", expectedAfterDeduction);

    const { error: reopenError } = await supabase
      .from("appointments")
      .update({ status: "pending" })
      .eq("id", appointmentId)
      .eq("clinic_id", CLINIC_ID);

    if (reopenError) throw new Error(reopenError.message);

    const reverseResult = await applyStockTransition(
      supabase,
      auth.user.id,
      appointmentId,
      "completed",
      "pending",
    );

    if (!reverseResult.reversed) {
      throw new Error("auto_reversal não aplicada ao reabrir consulta");
    }

    const { data: reversalMovements, error: reversalError } = await supabase
      .from("stock_movements")
      .select("movement_type, quantity")
      .eq("appointment_id", appointmentId)
      .eq("movement_type", "auto_reversal");

    if (reversalError) throw new Error(reversalError.message);
    if (!reversalMovements?.length) {
      throw new Error("Nenhum movimento auto_reversal encontrado");
    }
    console.log("OK auto_reversal", reversalMovements.length, "movimento(s)");

    const { data: supplyAfterReversal, error: reversalBalanceError } = await supabase
      .from("supplies")
      .select("quantity_on_hand")
      .eq("id", supplyId)
      .single();

    if (reversalBalanceError) throw new Error(reversalBalanceError.message);
    if (Number(supplyAfterReversal?.quantity_on_hand) !== INBOUND_QTY) {
      throw new Error(
        `Saldo após estorno inesperado: ${supplyAfterReversal?.quantity_on_hand}`,
      );
    }
    console.log("OK saldo após estorno", INBOUND_QTY);

    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
    const { buffer, filename } = await buildClinicExport(CLINIC_ID);
    if (buffer.length < 100) throw new Error("ZIP export muito pequeno");

    const zip = await JSZip.loadAsync(buffer);
    const zipFiles = Object.keys(zip.files).filter((name) => !name.endsWith("/"));
    for (const required of [
      "stock_movements.json",
      "stock_movements.csv",
      "appointment_stock_applied.json",
      "supplies.csv",
    ]) {
      if (!zipFiles.includes(required)) {
        throw new Error(`Export ZIP sem ${required}`);
      }
    }

    const suppliesCsv =
      (await zip.file("supplies.csv")?.async("string")) ?? "";
    if (!suppliesCsv.includes("quantity_on_hand")) {
      throw new Error("supplies.csv sem coluna quantity_on_hand");
    }
    if (!suppliesCsv.includes("min_quantity")) {
      throw new Error("supplies.csv sem coluna min_quantity");
    }

    const manifest = JSON.parse(
      (await zip.file("manifest.json")?.async("string")) ?? "{}",
    );
    if (manifest.schemaVersion !== "1.6") {
      throw new Error(`schemaVersion inesperado: ${manifest.schemaVersion}`);
    }
    if (typeof manifest.counts?.stock_movements !== "number") {
      throw new Error("manifest sem counts.stock_movements");
    }
    if (typeof manifest.counts?.appointment_stock_applied !== "number") {
      throw new Error("manifest sem counts.appointment_stock_applied");
    }

    console.log(
      "OK export LGPD",
      filename,
      buffer.length,
      "bytes",
      `| stock_movements: ${manifest.counts.stock_movements}`,
      `| appointment_stock_applied: ${manifest.counts.appointment_stock_applied}`,
    );

    console.log("\nSMOKE_ESTOQUE_OK");
  } finally {
    if (appointmentId) {
      await admin
        .from("stock_movements")
        .delete()
        .eq("appointment_id", appointmentId);
      await admin
        .from("appointment_stock_applied")
        .delete()
        .eq("appointment_id", appointmentId);
      await supabase.from("appointments").delete().eq("id", appointmentId);
    }
    await admin.from("stock_movements").delete().eq("supply_id", supplyId);
    await supabase.from("procedure_supply_items").delete().eq("id", bomId);
    await supabase.from("procedures").delete().eq("id", procedureId);
    await supabase.from("supplies").delete().eq("id", supplyId);
    console.log("OK cleanup");
  }
}

main().catch((error) => {
  console.error("SMOKE_ESTOQUE_FAIL", error);
  process.exit(1);
});
