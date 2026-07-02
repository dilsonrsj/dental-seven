/**
 * Smoke v5.1 — fornecedores (vínculo + WhatsApp reposição + export 1.6)
 * Uso: npx tsx scripts/smoke-fornecedores.ts
 */
import { existsSync, readFileSync } from "fs";
import { randomUUID } from "crypto";
import { resolve } from "path";
import JSZip from "jszip";
import { createClient } from "@supabase/supabase-js";
import { buildClinicExport } from "../src/lib/export/build-clinic-export";
import { buildReorderWhatsAppUrl } from "../src/modules/fornecedores/whatsapp-reorder";
import { getStockAlertLevel, isStockAlert } from "../src/modules/estoque/stock-level";

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";
const EMAIL = "v2smoke-full-20260702@test.dr7.app";
const PASSWORD = "demo2026v2";
const SUPPLIER_NAME = "Fornecedor Smoke v5.1 Fornecedores";
const SUPPLY_NAME = "Luva Smoke v5.1 Fornecedores";
const SUPPLIER_PHONE = "11987654321";
const MIN_QTY = 5;
const QTY_ON_HAND = 3;

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
  await ensureModuleEnabled(admin, "fornecedores");

  const supplierId = randomUUID();
  const supplyId = randomUUID();

  try {
    const { data: supplier, error: supplierError } = await supabase
      .from("suppliers")
      .insert({
        id: supplierId,
        clinic_id: CLINIC_ID,
        name: SUPPLIER_NAME,
        phone: SUPPLIER_PHONE,
        is_active: true,
      })
      .select("id, name, phone")
      .single();

    if (supplierError) {
      throw new Error(`Insert supplier falhou: ${supplierError.message}`);
    }
    console.log("OK supplier", supplier);

    const { data: supply, error: supplyError } = await supabase
      .from("supplies")
      .insert({
        id: supplyId,
        clinic_id: CLINIC_ID,
        name: SUPPLY_NAME,
        unit_label: "par",
        is_active: true,
        quantity_on_hand: QTY_ON_HAND,
        min_quantity: MIN_QTY,
        preferred_supplier_id: supplierId,
      })
      .select("id, name, min_quantity, preferred_supplier_id, quantity_on_hand, unit_label")
      .single();

    if (supplyError) throw new Error(`Insert supply falhou: ${supplyError.message}`);
    if (supply?.preferred_supplier_id !== supplierId) {
      throw new Error(
        `preferred_supplier_id inesperado: ${supply?.preferred_supplier_id}`,
      );
    }
    console.log("OK supply vinculado", supply?.name, "→", supplier?.name);

    const alertLevel = getStockAlertLevel({
      quantity_on_hand: QTY_ON_HAND,
      min_quantity: MIN_QTY,
    });
    if (!isStockAlert(alertLevel)) {
      throw new Error(`Esperado alerta de estoque, recebido: ${alertLevel}`);
    }
    console.log("OK alerta estoque", alertLevel);

    const whatsappUrl = buildReorderWhatsAppUrl({
      phone: SUPPLIER_PHONE,
      supplyName: SUPPLY_NAME,
      quantityOnHand: QTY_ON_HAND,
      unitLabel: "par",
      minQuantity: MIN_QTY,
    });

    if (!whatsappUrl) {
      throw new Error("buildReorderWhatsAppUrl retornou null");
    }
    if (!whatsappUrl.includes("wa.me")) {
      throw new Error(`URL WhatsApp sem wa.me: ${whatsappUrl}`);
    }
    if (!decodeURIComponent(whatsappUrl).includes(SUPPLY_NAME)) {
      throw new Error(`URL WhatsApp sem nome do insumo: ${whatsappUrl}`);
    }
    console.log("OK whatsapp reorder URL");

    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
    const { buffer, filename } = await buildClinicExport(CLINIC_ID);
    if (buffer.length < 100) throw new Error("ZIP export muito pequeno");

    const zip = await JSZip.loadAsync(buffer);
    const zipFiles = Object.keys(zip.files).filter((name) => !name.endsWith("/"));
    for (const required of ["suppliers.json", "suppliers.csv", "supplies.csv"]) {
      if (!zipFiles.includes(required)) {
        throw new Error(`Export ZIP sem ${required}`);
      }
    }

    const suppliersJson = JSON.parse(
      (await zip.file("suppliers.json")?.async("string")) ?? "[]",
    ) as { id: string; name: string }[];
    if (!suppliersJson.some((row) => row.id === supplierId)) {
      throw new Error("suppliers.json não contém fornecedor smoke");
    }

    const suppliesCsv =
      (await zip.file("supplies.csv")?.async("string")) ?? "";
    if (!suppliesCsv.includes("preferred_supplier_id")) {
      throw new Error("supplies.csv sem coluna preferred_supplier_id");
    }

    const manifest = JSON.parse(
      (await zip.file("manifest.json")?.async("string")) ?? "{}",
    );
    if (manifest.schemaVersion !== "1.6") {
      throw new Error(`schemaVersion inesperado: ${manifest.schemaVersion}`);
    }
    if (typeof manifest.counts?.suppliers !== "number") {
      throw new Error("manifest sem counts.suppliers");
    }

    console.log(
      "OK export LGPD",
      filename,
      buffer.length,
      "bytes",
      `| suppliers: ${manifest.counts.suppliers}`,
    );

    console.log("\nSMOKE_FORNECEDORES_OK");
  } finally {
    await admin.from("supplies").delete().eq("id", supplyId);
    await admin.from("suppliers").delete().eq("id", supplierId);
    console.log("OK cleanup");
  }
}

main().catch((error) => {
  console.error("SMOKE_FORNECEDORES_FAIL", error);
  process.exit(1);
});
