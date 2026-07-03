/**
 * Smoke v6 — SuperAdmin (usage, audit, fair use, impersonation guards)
 * Uso: npx tsx scripts/smoke-superadmin.ts
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { computeDashboardKpis } from "../src/modules/admin/dashboard-metrics";
import {
  isImpersonationBlockedPath,
  isImpersonationValid,
  parseImpersonationCookie,
} from "../src/modules/admin/impersonation";
import {
  buildFairUseStatus,
  getFairUseCaps,
  getOverallFairUseLevel,
} from "../src/modules/admin/usage";
import { detectFairUseEmailAlerts } from "../src/modules/admin/fair-use-alerts";
import {
  getCurrentYearMonth,
  syncClinicUsageMonthly,
} from "../src/modules/admin/sync-usage";

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";

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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("OK helpers impersonation");
  const payload = parseImpersonationCookie(
    JSON.stringify({
      clinicId: CLINIC_ID,
      startedAt: new Date().toISOString(),
      actorId: "actor-1",
    }),
  );
  if (!payload || !isImpersonationValid(payload, "actor-1")) {
    throw new Error("impersonation helpers falharam");
  }
  if (!isImpersonationBlockedPath(`/pacientes/x/prontuario`)) {
    throw new Error("prontuário deveria estar bloqueado na impersonação");
  }

  console.log("OK fair use caps e thresholds");
  const caps = getFairUseCaps("completo");
  if (caps.whatsapp !== 2500 || caps.ai !== 3500) {
    throw new Error("caps completo incorretos");
  }
  const status = buildFairUseStatus("completo", {
    whatsapp_conversations: 2100,
    ai_responses: 2900,
  });
  if (getOverallFairUseLevel(status) !== "warning") {
    throw new Error("fair use level esperado warning");
  }
  const thresholds = detectFairUseEmailAlerts(
    [
      {
        id: CLINIC_ID,
        name: "Smoke",
        plan_key: "completo",
        deleted_at: null,
      },
    ],
    new Map([
      [
        CLINIC_ID,
        { whatsapp_conversations: 2100, ai_responses: 2900 },
      ],
    ]),
    getCurrentYearMonth(),
    new Set(),
  );
  if (thresholds.length < 2) {
    throw new Error("detectFairUseThresholds deveria retornar whatsapp e ai");
  }

  const { data: clinics, error: clinicsError } = await admin
    .from("clinics")
    .select("id, name, slug, subscription_status, plan_key, trial_ends_at, deleted_at")
    .limit(20);

  if (clinicsError) throw new Error(clinicsError.message);
  if (!clinics?.length) throw new Error("nenhuma clínica encontrada");

  const kpis = computeDashboardKpis(clinics);
  console.log(
    `OK dashboard KPIs — ativas=${kpis.activeCount} trial=${kpis.trialingCount} mrr=${kpis.estimatedMrr}`,
  );

  const yearMonth = getCurrentYearMonth();
  const usageRow = await syncClinicUsageMonthly(CLINIC_ID, yearMonth, admin);
  console.log(
    `OK sync usage ${yearMonth} — whatsapp=${usageRow.whatsapp_conversations}`,
  );

  const superAdmin = (await admin
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle()).data;

  if (!superAdmin) {
    throw new Error("nenhum profile super_admin no banco");
  }

  const { error: auditError } = await admin.from("admin_audit_log").insert({
    actor_id: superAdmin.id,
    action: "clinic.module_toggled",
    clinic_id: CLINIC_ID,
    metadata: { smoke: true, moduleKey: "agenda", enabled: true },
  });

  if (auditError) throw new Error(auditError.message);
  console.log("OK admin_audit_log insert");

  const { data: clinicRow, error: clinicError } = await admin
    .from("clinics")
    .select("admin_notes, whatsapp_throttled")
    .eq("id", CLINIC_ID)
    .single();

  if (clinicError) throw new Error(clinicError.message);
  console.log(
    `OK clinics v6 columns — notes=${clinicRow.admin_notes === null ? "null" : "set"} throttled=${clinicRow.whatsapp_throttled}`,
  );

  const { error: webhookError } = await admin.from("asaas_webhook_events").insert({
    event_type: "SMOKE_TEST",
    clinic_id: CLINIC_ID,
    payload: { smoke: true, at: new Date().toISOString() },
  });

  if (webhookError) throw new Error(webhookError.message);
  console.log("OK asaas_webhook_events insert");

  console.log("\nSmoke v6 SuperAdmin concluído com sucesso.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
