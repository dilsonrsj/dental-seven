"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { processFairUseAlertEmails } from "@/lib/email/fair-use-alerts";
import { logAdminAction } from "@/modules/admin/audit";
import {
  buildRefSlugBase,
  buildFoundingReferralUrl,
  resolveUniqueRefSlug,
} from "@/lib/founding/ref-slug";
import { getFoundingStage } from "@/modules/admin/founding-pipeline";
import {
  buildActionQueue,
  clinicsCreatedSince,
  summarizeFounding,
} from "@/modules/admin/operations-dashboard";
import {
  startImpersonation,
  stopImpersonation,
} from "@/modules/admin/impersonation";
import {
  getCurrentYearMonth,
  syncAllClinicsUsageMonthly,
  syncClinicUsageMonthly,
} from "@/modules/admin/sync-usage";
import type {
  AdminAuditLogFilters,
  AdminAuditLogRow,
  AdminClinicListFilters,
  AdminClinicRecord,
  AdminDashboardData,
  BetaFeedbackAdminRow,
  ClinicDetailForAdmin,
  ClinicListRow,
  FairUseAlertRow,
  FounderAdminRow,
  FounderFeedbackStatus,
} from "@/modules/admin/types";
import {
  computeDashboardKpis,
  trialsExpiringSoon,
} from "@/modules/admin/dashboard-metrics";
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
import { trialEndsAtFromNow } from "@/lib/billing/subscription";
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
  "convenios",
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

async function loadClinicUsageCounts(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{
  patients: Map<string, number>;
  appointments: Map<string, number>;
}> {
  const patients = new Map<string, number>();
  const appointments = new Map<string, number>();

  const [{ data: patientRows, error: patientError }, { data: appointmentRows, error: appointmentError }] =
    await Promise.all([
      admin.from("patients").select("clinic_id"),
      admin.from("appointments").select("clinic_id"),
    ]);

  if (patientError) throw new Error(patientError.message);
  if (appointmentError) throw new Error(appointmentError.message);

  for (const row of patientRows ?? []) {
    patients.set(
      row.clinic_id,
      (patients.get(row.clinic_id) ?? 0) + 1,
    );
  }

  for (const row of appointmentRows ?? []) {
    appointments.set(
      row.clinic_id,
      (appointments.get(row.clinic_id) ?? 0) + 1,
    );
  }

  return { patients, appointments };
}

async function ensureFounderRefSlug(
  admin: ReturnType<typeof createAdminClient>,
  founder: {
    id: string;
    ref_slug: string | null;
    full_name: string;
    city: string;
    state: string;
  },
): Promise<string> {
  if (founder.ref_slug) {
    return founder.ref_slug;
  }

  const refSlug = await resolveUniqueRefSlug(
    buildRefSlugBase(founder.full_name, founder.city, founder.state),
    async (slug) => {
      const { data } = await admin
        .from("beta_founders")
        .select("id")
        .eq("ref_slug", slug)
        .maybeSingle();
      return Boolean(data && data.id !== founder.id);
    },
  );

  const { error } = await admin
    .from("beta_founders")
    .update({ ref_slug: refSlug })
    .eq("id", founder.id);

  if (error) throw new Error(error.message);
  return refSlug;
}

export async function getDashboardData(): Promise<AdminDashboardData> {
  const ctx = await requireSuperAdmin();
  const admin = createAdminClient();
  const yearMonth = getCurrentYearMonth();

  await syncAllClinicsUsageMonthly(yearMonth, admin);

  try {
    await processFairUseAlertEmails(ctx.profile.id);
  } catch (err) {
    console.error("[admin] fair use alert emails failed:", err);
  }

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

  const [{ patients, appointments }, foundersResult, recentAudit] =
    await Promise.all([
      loadClinicUsageCounts(admin),
      admin
        .from("beta_founders")
        .select(
          "id, full_name, clinic_name, city, state, created_at, signup_completed_at, invite_ref, clinic_id",
        )
        .order("created_at", { ascending: false }),
      listAdminAuditLog(10),
    ]);

  if (foundersResult.error) throw new Error(foundersResult.error.message);

  const founders = foundersResult.data ?? [];
  const adoptionClinics = records.map((clinic) => ({
    ...clinic,
    patient_count: patients.get(clinic.id) ?? 0,
    appointment_count: appointments.get(clinic.id) ?? 0,
  }));

  return {
    kpis: computeDashboardKpis(records),
    trialsExpiring: trialsExpiringSoon(records),
    fairUseAlerts,
    actionQueue: buildActionQueue({
      clinics: records,
      adoptionClinics,
      founders,
      fairUseAlerts,
    }),
    recentAudit,
    newClinics: clinicsCreatedSince(records),
    foundingSummary: summarizeFounding(founders),
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

export type ProvisionClinicInput = {
  name: string;
  slug: string;
  planKey: PlanKey;
  trialDays: number;
  adminEmail: string;
  adminName: string;
};

export type ProvisionClinicResult =
  | { ok: true; clinicId: string }
  | { ok: false; error: string };

function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function provisionClinicForAdmin(
  input: ProvisionClinicInput,
): Promise<ProvisionClinicResult> {
  const ctx = await requireSuperAdmin();

  const name = input.name.trim();
  const slug = normalizeSlug(input.slug.trim());
  const adminName = input.adminName.trim();
  const adminEmail = input.adminEmail.trim().toLowerCase();

  if (name.length < 2) {
    return { ok: false, error: "Nome da clínica muito curto." };
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: "Slug inválido." };
  }
  if (adminName.length < 2) {
    return { ok: false, error: "Nome do admin muito curto." };
  }
  if (!adminEmail.includes("@")) {
    return { ok: false, error: "E-mail inválido." };
  }
  if (input.trialDays <= 0 || input.trialDays > 90) {
    return { ok: false, error: "Dias de trial inválidos." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "Servidor não configurado: adicione SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    };
  }

  const { data: existingSlug } = await admin
    .from("clinics")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingSlug) {
    return { ok: false, error: "Slug já em uso." };
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.inviteUserByEmail(adminEmail, {
      data: { full_name: adminName },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/entrar`,
    });

  if (authError || !authData.user) {
    return {
      ok: false,
      error: authError?.message ?? "Não foi possível enviar o convite.",
    };
  }

  const userId = authData.user.id;

  const trialEndsAt = trialEndsAtFromNow(input.trialDays);

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({
      name,
      slug,
      subscription_status: "trialing",
      trial_ends_at: trialEndsAt,
      plan_key: input.planKey,
    })
    .select("id")
    .single();

  if (clinicError || !clinic) {
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      error: clinicError?.message ?? "Erro ao criar clínica.",
    };
  }

  const { data: dentist, error: dentistError } = await admin
    .from("dentists")
    .insert({
      clinic_id: clinic.id,
      name: adminName,
      color: "#4490E2",
      active: true,
    })
    .select("id")
    .single();

  if (dentistError || !dentist) {
    await admin.from("clinics").delete().eq("id", clinic.id);
    await admin.auth.admin.deleteUser(userId);
    return {
      ok: false,
      error: dentistError?.message ?? "Erro ao criar dentista.",
    };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    role: "clinic_admin",
    clinic_id: clinic.id,
    dentist_id: dentist.id,
    full_name: adminName,
  });

  if (profileError) {
    await admin.from("dentists").delete().eq("id", dentist.id);
    await admin.from("clinics").delete().eq("id", clinic.id);
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: profileError.message };
  }

  const moduleRows = ALL_MODULE_KEYS.map((moduleKey) => ({
    clinic_id: clinic.id,
    module_key: moduleKey,
    enabled: defaultModuleEnabled(input.planKey, moduleKey),
  }));

  const { error: modulesError } = await admin
    .from("clinic_modules")
    .insert(moduleRows);

  if (modulesError) {
    await admin.from("profiles").delete().eq("id", userId);
    await admin.from("dentists").delete().eq("id", dentist.id);
    await admin.from("clinics").delete().eq("id", clinic.id);
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: modulesError.message };
  }

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.provisioned",
    clinicId: clinic.id,
    metadata: {
      name,
      slug,
      planKey: input.planKey,
      trialDays: input.trialDays,
      adminEmail,
      adminName,
    },
  });

  revalidatePath("/admin/clinicas");
  revalidatePath("/admin");

  return { ok: true, clinicId: clinic.id };
}

export async function startClinicImpersonation(clinicId: string) {
  const ctx = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: clinic, error } = await admin
    .from("clinics")
    .select("id, name, deleted_at")
    .eq("id", clinicId)
    .maybeSingle();

  if (error || !clinic) throw new Error("Clínica não encontrada");
  if (clinic.deleted_at) throw new Error("Clínica encerrada.");

  await startImpersonation(clinicId, ctx.profile.id);

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.impersonation_started",
    clinicId,
    metadata: { clinicName: clinic.name },
  });

  redirect("/agenda");
}

export async function stopClinicImpersonation() {
  const ctx = await requireSuperAdmin();
  const authCtx = await requireAuthContext();
  const clinicId = authCtx.clinic?.id ?? null;

  await stopImpersonation();

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.impersonation_stopped",
    clinicId,
    metadata: {},
  });

  if (clinicId) {
    redirect(`/admin/clinicas/${clinicId}`);
  }
  redirect("/admin");
}

export async function listAdminAuditLog(
  limit = 50,
  filters: AdminAuditLogFilters = {},
): Promise<AdminAuditLogRow[]> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("admin_audit_log")
    .select("id, actor_id, action, clinic_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.clinicId) {
    query = query.eq("clinic_id", filters.clinicId);
  }
  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const actorIds = [...new Set(rows.map((r) => r.actor_id))];
  const clinicIds = [
    ...new Set(rows.map((r) => r.clinic_id).filter(Boolean)),
  ] as string[];

  const actorNames = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      actorNames.set(p.id, p.full_name);
    }
  }

  const clinicNames = new Map<string, string>();
  if (clinicIds.length > 0) {
    const { data: clinics } = await admin
      .from("clinics")
      .select("id, name")
      .in("id", clinicIds);
    for (const c of clinics ?? []) {
      clinicNames.set(c.id, c.name);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    actor_id: row.actor_id,
    actor_name: actorNames.get(row.actor_id) ?? "—",
    action: row.action,
    clinic_id: row.clinic_id,
    clinic_name: row.clinic_id
      ? (clinicNames.get(row.clinic_id) ?? "—")
      : null,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    created_at: row.created_at,
  }));
}

export async function updateClinicAdminNotes(
  clinicId: string,
  notes: string,
) {
  const ctx = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: current, error: readError } = await admin
    .from("clinics")
    .select("admin_notes")
    .eq("id", clinicId)
    .maybeSingle();

  if (readError || !current) throw new Error("Clínica não encontrada");

  const trimmed = notes.trim();
  const { error } = await admin
    .from("clinics")
    .update({ admin_notes: trimmed || null })
    .eq("id", clinicId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.notes_updated",
    clinicId,
    metadata: { from: current.admin_notes, to: trimmed || null },
  });

  revalidatePath(`/admin/clinicas/${clinicId}`);
}

export async function setClinicWhatsAppThrottled(
  clinicId: string,
  throttled: boolean,
) {
  const ctx = await requireSuperAdmin();
  const admin = createAdminClient();

  const { data: current, error: readError } = await admin
    .from("clinics")
    .select("whatsapp_throttled")
    .eq("id", clinicId)
    .maybeSingle();

  if (readError || !current) throw new Error("Clínica não encontrada");

  const { error } = await admin
    .from("clinics")
    .update({ whatsapp_throttled: throttled })
    .eq("id", clinicId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "clinic.whatsapp_throttle_set",
    clinicId,
    metadata: { from: current.whatsapp_throttled, to: throttled },
  });

  revalidatePath(`/admin/clinicas/${clinicId}`);
  revalidatePath("/admin/clinicas");
}

const FOUNDER_FEEDBACK_STATUSES: FounderFeedbackStatus[] = [
  "pending",
  "sent",
  "follow_up",
];

export async function updateFounderFeedbackStatus(
  founderId: string,
  status: FounderFeedbackStatus,
): Promise<void> {
  const ctx = await requireSuperAdmin();
  const admin = createAdminClient();

  if (!FOUNDER_FEEDBACK_STATUSES.includes(status)) {
    throw new Error("Status de feedback inválido.");
  }

  const { data: current, error: readError } = await admin
    .from("beta_founders")
    .select("feedback_status, clinic_id, full_name")
    .eq("id", founderId)
    .maybeSingle();

  if (readError || !current) {
    throw new Error("Founding member não encontrado.");
  }

  if (current.feedback_status === status) {
    return;
  }

  const { error } = await admin
    .from("beta_founders")
    .update({ feedback_status: status })
    .eq("id", founderId);

  if (error) throw new Error(error.message);

  await logAdminAction({
    actorId: ctx.profile.id,
    action: "founder.feedback_status_updated",
    clinicId: current.clinic_id,
    metadata: {
      founder_id: founderId,
      founder_name: current.full_name,
      from: current.feedback_status,
      to: status,
    },
  });

  revalidatePath("/admin/founding");
  revalidatePath("/admin");
}

export async function listFoundersForAdmin(): Promise<FounderAdminRow[]> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("beta_founders")
    .select(
      "id, ref_slug, full_name, clinic_name, city, state, whatsapp, email, invite_ref, feedback_status, clinic_id, created_at, accessed_at, signup_completed_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const founders = data ?? [];
  const { patients, appointments } = await loadClinicUsageCounts(admin);

  const referralCounts = new Map<string, number>();
  for (const founder of founders) {
    const ref = founder.invite_ref?.trim();
    if (!ref) continue;
    referralCounts.set(ref, (referralCounts.get(ref) ?? 0) + 1);
  }

  const rows: FounderAdminRow[] = [];

  for (const founder of founders) {
    const refSlug = await ensureFounderRefSlug(admin, founder);
    const patientCount = founder.clinic_id
      ? (patients.get(founder.clinic_id) ?? 0)
      : 0;
    const appointmentCount = founder.clinic_id
      ? (appointments.get(founder.clinic_id) ?? 0)
      : 0;

    rows.push({
      id: founder.id,
      ref_slug: refSlug,
      full_name: founder.full_name,
      clinic_name: founder.clinic_name,
      city: founder.city,
      state: founder.state,
      whatsapp: founder.whatsapp,
      email: founder.email,
      invite_ref: founder.invite_ref,
      feedback_status: founder.feedback_status,
      clinic_id: founder.clinic_id,
      created_at: founder.created_at,
      accessed_at: founder.accessed_at,
      signup_completed_at: founder.signup_completed_at,
      patient_count: patientCount,
      appointment_count: appointmentCount,
      referral_count: referralCounts.get(refSlug) ?? 0,
      stage: getFoundingStage({
        accessed_at: founder.accessed_at,
        signup_completed_at: founder.signup_completed_at,
        clinic_id: founder.clinic_id,
        patient_count: patientCount,
        appointment_count: appointmentCount,
      }),
      referral_url: buildFoundingReferralUrl(refSlug),
    });
  }

  return rows;
}

export async function listBetaFeedbackForAdmin(): Promise<
  BetaFeedbackAdminRow[]
> {
  await requireSuperAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("beta_feedback")
    .select(
      "id, created_at, clinic_id, profile_id, nps, top_module, liked_most, blocked_or_missing, would_use_today, notes",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const feedbackRows = data ?? [];
  const clinicIds = [
    ...new Set(
      feedbackRows
        .map((row) => row.clinic_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const profileIds = [
    ...new Set(
      feedbackRows
        .map((row) => row.profile_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const clinicNameById = new Map<string, string>();
  if (clinicIds.length > 0) {
    const { data: clinics } = await admin
      .from("clinics")
      .select("id, name")
      .in("id", clinicIds);
    for (const clinic of clinics ?? []) {
      clinicNameById.set(clinic.id, clinic.name);
    }
  }

  const authorNameById = new Map<string, string>();
  if (profileIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", profileIds);
    for (const profile of profiles ?? []) {
      authorNameById.set(profile.id, profile.full_name);
    }
  }

  return feedbackRows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    clinic_id: row.clinic_id,
    clinic_name: row.clinic_id
      ? (clinicNameById.get(row.clinic_id) ?? null)
      : null,
    author_name: row.profile_id
      ? (authorNameById.get(row.profile_id) ?? null)
      : null,
    nps: row.nps,
    top_module: row.top_module,
    liked_most: row.liked_most,
    blocked_or_missing: row.blocked_or_missing,
    would_use_today: row.would_use_today,
    notes: row.notes,
  }));
}
