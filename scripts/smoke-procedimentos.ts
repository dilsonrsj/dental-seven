/**
 * Smoke v3 — procedimentos (catálogo + BOM + agenda)
 * Uso: npx tsx scripts/smoke-procedimentos.ts
 */
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { resolve } from "path";
import JSZip from "jszip";
import { createClient } from "@supabase/supabase-js";
import { buildClinicExport } from "../src/lib/export/build-clinic-export";

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";
const PATIENT_ID = "786f4632-35c1-4f4a-882f-26e4c5ac87c8";
const EMAIL = "v2smoke-full-20260702@test.dr7.app";
const PASSWORD = "demo2026v2";
const PROCEDURE_NAME = "Limpeza Smoke v3";
const SUPPLY_NAME = "Luva Smoke v3";

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

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !serviceKey) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL, ANON_KEY e SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, anon);
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authError || !auth.user) {
    throw new Error(`Login falhou: ${authError?.message}`);
  }
  console.log("OK login", auth.user.email);

  const { data: moduleRow, error: moduleError } = await supabase
    .from("clinic_modules")
    .select("enabled")
    .eq("clinic_id", CLINIC_ID)
    .eq("module_key", "procedimentos")
    .maybeSingle();

  if (moduleError) throw new Error(moduleError.message);
  if (!moduleRow?.enabled) {
    throw new Error("Módulo procedimentos não está habilitado para a clínica smoke");
  }
  console.log("OK módulo procedimentos habilitado");

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

    if (procedureError) throw new Error(`Insert procedure falhou: ${procedureError.message}`);
    console.log("OK procedure", procedure);

    const { data: supply, error: supplyError } = await supabase
      .from("supplies")
      .insert({
        id: supplyId,
        clinic_id: CLINIC_ID,
        name: SUPPLY_NAME,
        unit_label: "par",
        is_active: true,
      })
      .select("id, name")
      .single();

    if (supplyError) throw new Error(`Insert supply falhou: ${supplyError.message}`);
    console.log("OK supply", supply);

    const { data: bom, error: bomError } = await supabase
      .from("procedure_supply_items")
      .insert({
        id: bomId,
        clinic_id: CLINIC_ID,
        procedure_id: procedureId,
        supply_id: supplyId,
        quantity: 2,
      })
      .select("id, quantity")
      .single();

    if (bomError) throw new Error(`Insert BOM falhou: ${bomError.message}`);
    console.log("OK BOM qty", bom?.quantity);

    const { data: listedProcedures, error: listProcError } = await supabase
      .from("procedures")
      .select("id, name")
      .eq("clinic_id", CLINIC_ID)
      .eq("is_active", true);

    if (listProcError) throw new Error(listProcError.message);
    if (!listedProcedures?.some((row) => row.id === procedureId)) {
      throw new Error("Procedimento smoke não aparece na listagem");
    }
    console.log("OK listagem procedures", listedProcedures.length);

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
    startsAt.setUTCDate(startsAt.getUTCDate() + 14);
    startsAt.setUTCHours(15, 0, 0, 0);
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
        notes: "Smoke v3 procedimentos",
      })
      .select("id, procedure_id, procedure_label")
      .single();

    if (appointmentError) {
      throw new Error(`Insert appointment falhou: ${appointmentError.message}`);
    }
    if (appointment?.procedure_id !== procedureId) {
      throw new Error(`procedure_id inesperado: ${appointment?.procedure_id}`);
    }
    if (appointment?.procedure_label !== PROCEDURE_NAME) {
      throw new Error(`procedure_label inesperado: ${appointment?.procedure_label}`);
    }
    console.log("OK appointment", appointment);

    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
    const { buffer, filename } = await buildClinicExport(CLINIC_ID);
    if (buffer.length < 100) throw new Error("ZIP export muito pequeno");

    const zip = await JSZip.loadAsync(buffer);
    const zipFiles = Object.keys(zip.files).filter((name) => !name.endsWith("/"));
    for (const required of [
      "procedures.json",
      "procedures.csv",
      "supplies.json",
      "supplies.csv",
      "procedure_supply_items.json",
      "procedure_supply_items.csv",
    ]) {
      if (!zipFiles.includes(required)) {
        throw new Error(`Export ZIP sem ${required}`);
      }
    }

    const manifest = JSON.parse(
      (await zip.file("manifest.json")?.async("string")) ?? "{}",
    );
    if (manifest.schemaVersion !== "1.5") {
      throw new Error(`schemaVersion inesperado: ${manifest.schemaVersion}`);
    }
    console.log(
      "OK export LGPD",
      filename,
      buffer.length,
      "bytes",
      `| procedures: ${manifest.counts?.procedures ?? 0}`,
      `| BOM: ${manifest.counts?.procedure_supply_items ?? 0}`,
    );

    console.log("\nSMOKE_PROCEDIMENTOS_OK");
  } finally {
    if (appointmentId) {
      await supabase.from("appointments").delete().eq("id", appointmentId);
    }
    await supabase.from("procedure_supply_items").delete().eq("id", bomId);
    await supabase.from("procedures").delete().eq("id", procedureId);
    await supabase.from("supplies").delete().eq("id", supplyId);
    console.log("OK cleanup");
  }
}

main().catch((error) => {
  console.error("SMOKE_PROCEDIMENTOS_FAIL", error);
  process.exit(1);
});
