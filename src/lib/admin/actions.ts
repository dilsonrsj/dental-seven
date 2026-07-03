"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAction } from "@/modules/admin/audit";
import {
  computeDashboardKpis,
  trialsExpiringSoon,
} from "@/modules/admin/dashboard-metrics";
import {
  getCurrentYearMonth,
  syncAllClinicsUsageMonthly,
  syncClinicUsageMonthly,
} from "@/modules/admin/sync-usage";
import type {
  AdminClinicListFilters,
  AdminClinicRecord,
  AdminDashboardData,
  ClinicDetailForAdmin,
  ClinicListRow,
  FairUseAlertRow,
} from "@/modules/admin/types";
import {
  buildFairUseStatus,
  getOverallFairUseLevel,
} from "@/modules/admin/usage";
import { requireAuthContext } from "@/lib/auth/context";
import {
  defaultModuleEnabled,
  type ModuleKey,
  type PlanKey,
} from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/subscription";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ALL_MODULE_KEYS: ModuleKey[] = [
  "agenda",
  "pacientes",
  "whatsapp",
  "ai_agent",
  "prontuario",
  "procedimentos",
  "estoque",
  "financeiro",
  "fornecedores",
];

const CLINIC_LIST_SELECT =
  "id, name, slug, subscription_status, plan_key, trial_ends_at, deleted_at, created_at";

const CLINIC_DETAIL_SELECT =
  "id, name, slug, subscription_status, plan_key, trial_ends_at, deleted_at, created_at, asaas_customer_id, asaas_subscription_id, admin_notes, whatsapp_throttled";

type UsageMap = Map<
  string,
  { whatsapp_conversations: number; ai_responses: number }
>;

export async function requireSuperAdmin() {
  const ctx = await requireAuthContext();
  if (ctx.profile.role !== "super_admin") {
    redirect("/agenda");
  }
  return ctx;
}

async function loadUsageMap(
  admin: ReturnType<typeof createAdminClient>,
  yearMonth: string,
): Promise<UsageMap> {
  const { data, error } = await admin
    .from("clinic_usage_monthly")
    .select("clinic_id, whatsapp_conversations, ai_responses")
    .eq("year_month", yearMonth);

  if (error) throw new Error(error.message);

  const map: UsageMap = new Map();
  for (const row of data ?? []) {
    map.set(row.clinic_id, {
      whatsapp_conversations: row.whatsapp_conversations,
      ai_responses: row.ai_responses,
    });
  }
  return map;
}

function toClinicListRow(
  clinic: AdminClinicRecord,
  usageMap: UsageMap,
): ClinicListRow {
  const usage = usageMap.get(clinic.id) ?? {
    whatsapp_conversations: 0,
    ai_responses: 0,
  };
  const fairUse = buildFairUseStatus(clinic.plan_key, usage);

  return {
    ...clinic,
    whatsappUsagePercent: fairUse.whatsapp.percent,
    aiUsagePercent: fairUse.ai.percent,
    fairUseLevel: getOverallFairUseLevel(fairUse),
  };
}

function matchesSearch(clinic: AdminClinicRecord, search?: string): boolean {
  if (!search?.trim()) return true;
  const term = search.trim().toLowerCase();
  return (
    clinic.name.toLowerCase().includes(term) ||
    clinic.slug.toLowerCase().includes(term)
  );
}

export async function getDashboardData(): Promise<AdminDashboardData> {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const yearMonth = getCurrentYearMonth();

  await syncAllClinicsUsageMonthly(yearMonth, admin);

  const { data: clinics, error } = await admin
    .from("clinics")
    .select(CLINIC_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const records = (clinics ?? []) as AdminClinicRecord[];
  const usageMap = await loadUsageMap(admin, yearMonth);

  const fairUseAlerts: FairUseAlertRow[] = records
    .map((clinic) => {
      const usage = usageMap.get(clinic.id) ?? {
        whatsapp_conversations: 0,
        ai_responses: 0,
      };
      const fairUse = buildFairUseStatus(clinic.plan_key, usage);
      const fairUseLevel = getOverallFairUseLevel(fairUse);
      return { ...clinic, fairUse, fairUseLevel };
    })
    .filter(
      (row) =>
        !row.deleted_at &&
        (row.fairUseLevel === "warning" || row.fairUseLevel === "exceeded"),
    )
    .sort((a, b) => {
      const aMax = Math.max(a.fairUse.whatsapp.percent ?? 0, a.fairUse.ai.percent ?? 0);
      const bMax = Math.max(b.fairUse.whatsapp.percent ?? 0, b.fairUse.ai.percent ?? 0);
      return bMax - aMax;
    });

  return {
    kpis: computeDashboardKpis(records),
    trialsExpiring: trialsExpiringSoon(records),
    fairUseAlerts,
  };
}

export async function listClinicsForAdmin(
  filters: AdminClinicListFilters = {},
): Promise<ClinicListRow[]> {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const yearMonth = getCurrentYearMonth();

  let query = admin
    .from("clinics")
    .select(CLINIC_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (filters.planKey) {
    query = query.eq("plan_key", filters.planKey);
  }
  if (filters.status) {
    query = query.eq("subscription_status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let records = (data ?? []) as AdminClinicRecord[];
  records = records.filter((clinic) => matchesSearch(clinic, filters.search));

  if (filters.moduleKey) {
    const { data: moduleRows, error: moduleError } = await admin
      .from("clinic_modules")
      .select("clinic_id")
      .eq("module_key", filters.moduleKey)
      .eq("enabled", true);

    if (moduleError) throw new Error(moduleError.message);

    const enabledClinicIds = new Set(
      (moduleRows ?? []).map((row) => row.clinic_id),
    );
    records = records.filter((clinic) => enabledClinicIds.has(clinic.id));
  }

  const usageMap = await loadUsageMap(admin, yearMonth);
  let rows = records.map((clinic) => toClinicListRow(clinic, usageMap));

  if (filters.fairUseAlert) {
    rows = rows.filter(
      (row) => row.fairUseLevel === "warning" || row.fairUseLevel === "exceeded",
    );
  }

  return rows;
}

export async function getClinicDetailForAdmin(
  clinicId: string,
): Promise<ClinicDetailForAdmin> {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const yearMonth = getCurrentYearMonth();

  await syncClinicUsageMonthly(clinicId, yearMonth, admin);

  const { data: clinic, error } = await admin
    .from("clinics")
    .select(CLINIC_DETAIL_SELECT)
    .eq("id", clinicId)
    .maybeSingle();

  if (error || !clinic) throw new Error("Clínica não encontrada");

  const { data: usageRow } = await admin
    .from("clinic_usage_monthly")
    .select("whatsapp_conversations, ai_responses, storage_bytes")
    .eq("clinic_id", clinicId)
    .eq("year_month", yearMonth)
    .maybeSingle();

  const usage = usageRow ?? {
    whatsapp_conversations: 0,
    ai_responses: 0,
  };

  const { data: modules, error: modulesError } = await admin
    .from("clinic_modules")
    .select("module_key, enabled")
    .eq("clinic_id", clinicId)
    .order("module_key");

  if (modulesError) throw new Error(modulesError.message);

  const { data: webhookEvents, error: webhookError } = await admin
    .from("asaas_webhook_events")
    .select("id, event_type, payload, created_at")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (webhookError) throw new Error(webhookError.message);

  const fairUse = buildFairUseStatus(clinic.plan_key as PlanKey, usage);

  return {
    clinic: {
      ...(clinic as AdminClinicRecord),
      fairUse,
      asaas_customer_id: clinic.asaas_customer_id as string | null,
      asaas_subscription_id: clinic.asaas_subscription_id as string | null,
      admin_notes: clinic.admin_notes as string | null,
      whatsapp_throttled: Boolean(clinic.whatsapp_throttled),
    },
    modules: modules ?? [],
    webhookEvents: (webhookEvents ?? []) as ClinicDetailForAdmin["webhookEvents"],
    storageBytes: usageRow?.storage_bytes ?? 0,
    yearMonth,
  };
}

/** @deprecated Use getClinicDetailForAdmin */
export async function getClinicForAdmin(clinicId: string) {
  const detail = await getClinicDetailForAdmin(clinicId);
  return {
    clinic: detail.clinic,
    modules: detail.modules,
  };
}

async function applyPlanModuleDefaults(clinicId: string, planKey: PlanKey) {
  const admin = createAdminClient();

  for (const moduleKey of ALL_MODULE_KEYS) {
    const { error } = await admin.from("clinic_modules").upsert(
      {
        clinic_id: clinicId,
        module_key: moduleKey,
        enabled: defaultModuleEnabled(planKey, moduleKey),
      },
      { onConflict: "clinic_id,module_key" },
    );

    if (error) throw new Error(error.message);
  }
}

export async function updateClinicPlan(clinicId: string, planKey: PlanKey) {
  const ctx = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: current, error: readError } = await admin
    .from("clinics")
    .select("plan_key")
    .eq("id", clinicId)
    .maybeSingle();

  if (readError || !current) throw new Error("Clínica não encontrada");

  const { error } = await admin
    .from("clinics")
    .update({ plan_key: planKey })
    .eq("id", clinicId);

  if (error) throw new Error(error.message);

  await applyPlanModuleDefaults(clinicId, planKey);

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.plan_changed",
    clinicId,
    metadata: { from: current.plan_key, to: planKey },
  });

  revalidatePath(`/admin/clinicas/${clinicId}`);
  revalidatePath("/admin/clinicas");
  revalidatePath("/admin");
}

export async function extendClinicTrial(clinicId: string, extraDays: number) {
  const ctx = await requireSuperAdmin();
  if (extraDays <= 0) throw new Error("Dias inválidos");

  const admin = createAdminClient();
  const { data: current, error: readError } = await admin
    .from("clinics")
    .select("trial_ends_at")
    .eq("id", clinicId)
    .maybeSingle();

  if (readError || !current) throw new Error("Clínica não encontrada");

  const base = current.trial_ends_at
    ? new Date(current.trial_ends_at)
    : new Date();
  base.setDate(base.getDate() + extraDays);

  const { error } = await admin
    .from("clinics")
    .update({
      trial_ends_at: base.toISOString(),
      subscription_status: "trialing",
    })
    .eq("id", clinicId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.trial_extended",
    clinicId,
    metadata: { extraDays, trial_ends_at: base.toISOString() },
  });

  revalidatePath(`/admin/clinicas/${clinicId}`);
  revalidatePath("/admin/clinicas");
  revalidatePath("/admin");
}

export async function setClinicSubscriptionStatus(
  clinicId: string,
  status: SubscriptionStatus,
) {
  const ctx = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: current, error: readError } = await admin
    .from("clinics")
    .select("subscription_status")
    .eq("id", clinicId)
    .maybeSingle();

  if (readError || !current) throw new Error("Clínica não encontrada");

  const { error } = await admin
    .from("clinics")
    .update({ subscription_status: status })
    .eq("id", clinicId);

  if (error) throw new Error(error.message);

  const action =
    status === "active"
      ? "clinic.reactivated"
      : status === "past_due"
        ? "clinic.suspended"
        : "clinic.suspended";

  await logAdminAction({
    actorId: ctx.profile.id,
    action,
    clinicId,
    metadata: { from: current.subscription_status, to: status },
  });

  revalidatePath(`/admin/clinicas/${clinicId}`);
  revalidatePath("/admin/clinicas");
  revalidatePath("/admin");
}

export async function logClinicExportRequest(clinicId: string) {
  const ctx = await requireSuperAdmin();

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.export_requested",
    clinicId,
    metadata: {},
  });
}

export async function toggleClinicModule(
  clinicId: string,
  moduleKey: string,
  enabled: boolean,
) {
  const ctx = await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("clinic_modules")
    .update({ enabled })
    .eq("clinic_id", clinicId)
    .eq("module_key", moduleKey);

  if (error) throw new Error(error.message);

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.module_toggled",
    clinicId,
    metadata: { moduleKey, enabled },
  });

  revalidatePath(`/admin/clinicas/${clinicId}`);
  revalidatePath("/admin");
}

export async function requestAccountClosure(
  clinicNameConfirm: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requireAuthContext();
  if (ctx.profile.role !== "clinic_admin" || !ctx.clinic) {
    return { ok: false, error: "Sem permissão." };
  }

  if (clinicNameConfirm.trim() !== ctx.clinic.name) {
    return { ok: false, error: "Nome da clínica não confere." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: ctx.email,
    password,
  });

  if (signInError) {
    return { ok: false, error: "Senha incorreta." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("clinics")
    .update({
      deleted_at: new Date().toISOString(),
      subscription_status: "canceled",
    })
    .eq("id", ctx.clinic.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase.auth.signOut();
  redirect("/entrar");
}
