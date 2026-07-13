"use server";

import { revalidatePath } from "next/cache";
import {
  getAuthContext,
  requireAuthContext,
  requireClinicId,
} from "@/lib/auth/context";
import type { PlanKey } from "@/lib/billing/plans";
import {
  assertCanAddDentist,
  getDentistQuotaSummary,
  getQuotaAfterInvite,
} from "@/lib/billing/dentist-quota";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/modules/admin/audit";

const DENTIST_COLORS = [
  "#4490E2",
  "#E24444",
  "#44E290",
  "#E2A844",
  "#9444E2",
  "#44C4E2",
] as const;

export type ClinicTeamMember = {
  id: string;
  name: string;
  color: string;
  email: string | null;
};

export type ClinicTeamData = {
  members: ClinicTeamMember[];
  quota: ReturnType<typeof getDentistQuotaSummary>;
  planKey: PlanKey;
};

async function assertClinicAdminWritable() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Clínica não encontrada.");
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Somente o administrador da clínica pode gerenciar a equipe.");
  }
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function pickDentistColor(usedColors: string[]): string {
  const available = DENTIST_COLORS.find((color) => !usedColors.includes(color));
  return available ?? DENTIST_COLORS[usedColors.length % DENTIST_COLORS.length];
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

async function findProfileByEmail(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw new Error(error.message);

  const user = data.users.find(
    (entry) => entry.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) return null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, clinic_id, role, dentist_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  return profile ? { user, profile } : null;
}

async function copyClinicHoursToDentist(
  admin: ReturnType<typeof createAdminClient>,
  clinicId: string,
  dentistId: string,
) {
  const { data: clinicHours, error } = await admin
    .from("clinic_operating_hours")
    .select("day_of_week, is_open, opens_at, closes_at")
    .eq("clinic_id", clinicId);

  if (error) throw new Error(error.message);
  if (!clinicHours?.length) return;

  const rows = clinicHours.map((row) => ({
    dentist_id: dentistId,
    clinic_id: clinicId,
    day_of_week: row.day_of_week,
    is_open: row.is_open,
    opens_at: row.opens_at,
    closes_at: row.closes_at,
  }));

  const { error: insertError } = await admin
    .from("dentist_operating_hours")
    .insert(rows);

  if (insertError) throw new Error(insertError.message);
}

export async function getClinicTeam(): Promise<ClinicTeamData | null> {
  if (isDemoMockDataEnabled()) return null;

  const ctx = await requireAuthContext();
  if (!ctx.clinic || ctx.profile.role !== "clinic_admin") return null;

  const clinicId = await requireClinicId();
  const admin = createAdminClient();

  const { data: dentists, error } = await admin
    .from("dentists")
    .select("id, name, color")
    .eq("clinic_id", clinicId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, dentist_id")
    .eq("clinic_id", clinicId)
    .not("dentist_id", "is", null);

  if (profilesError) throw new Error(profilesError.message);

  const emailByDentistId = new Map<string, string>();
  for (const profile of profiles ?? []) {
    if (!profile.dentist_id) continue;
    const { data: userData } = await admin.auth.admin.getUserById(profile.id);
    const email = userData.user?.email ?? null;
    if (email) {
      emailByDentistId.set(profile.dentist_id, email);
    }
  }

  const members: ClinicTeamMember[] = (dentists ?? []).map((dentist) => ({
    id: dentist.id,
    name: dentist.name,
    color: dentist.color,
    email: emailByDentistId.get(dentist.id) ?? null,
  }));

  const planKey = ctx.clinic.plan_key;
  const quota = getDentistQuotaSummary({
    planKey,
    activeCount: members.length,
  });

  return { members, quota, planKey };
}

export async function inviteDentistToClinic(input: {
  name: string;
  email: string;
  color?: string;
  confirmExtraCharge?: boolean;
}): Promise<void> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Indisponível no modo demo.");
  }

  const ctx = await requireAuthContext();
  await assertClinicAdminWritable();

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const clinicId = await requireClinicId();
  const planKey = ctx.clinic!.plan_key;

  if (name.length < 2) {
    throw new Error("Nome do dentista muito curto.");
  }
  if (!email.includes("@")) {
    throw new Error("E-mail inválido.");
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    throw new Error(
      "Servidor não configurado: adicione SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
  }

  const { data: activeDentists, error: countError } = await admin
    .from("dentists")
    .select("id, color")
    .eq("clinic_id", clinicId)
    .eq("active", true);

  if (countError) throw new Error(countError.message);

  const activeCount = activeDentists?.length ?? 0;
  const quotaCheck = assertCanAddDentist({
    planKey,
    activeCount,
    confirmExtraCharge: input.confirmExtraCharge,
  });

  if (!quotaCheck.ok) {
    throw new Error(quotaCheck.reason);
  }

  const existing = await findProfileByEmail(email);
  if (existing?.profile.clinic_id === clinicId) {
    throw new Error("Este e-mail já está vinculado a um usuário desta clínica.");
  }
  if (existing?.profile.clinic_id && existing.profile.clinic_id !== clinicId) {
    throw new Error("Este e-mail já está em uso em outra clínica.");
  }

  const usedColors = (activeDentists ?? []).map((dentist) => dentist.color);
  const color =
    input.color?.trim() && isValidHexColor(input.color.trim())
      ? input.color.trim()
      : pickDentistColor(usedColors);

  const { data: dentist, error: dentistError } = await admin
    .from("dentists")
    .insert({
      clinic_id: clinicId,
      name,
      color,
      active: true,
    })
    .select("id")
    .single();

  if (dentistError || !dentist) {
    throw new Error(dentistError?.message ?? "Erro ao criar dentista.");
  }

  try {
    await copyClinicHoursToDentist(admin, clinicId, dentist.id);

    const { data: authData, error: authError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/entrar`,
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Não foi possível enviar o convite.");
    }

    const userId = authData.user.id;

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      role: "dentist",
      clinic_id: clinicId,
      dentist_id: dentist.id,
      full_name: name,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(profileError.message);
    }

    const afterQuota = getQuotaAfterInvite({ planKey, activeCountBefore: activeCount });

    await logAdminAction({
      actorId: ctx.profile.id,
      action:
        afterQuota.extraAfter > 0 ? "dentist.extra_added" : "dentist.invited",
      clinicId,
      metadata: {
        dentistId: dentist.id,
        email,
        name,
        planKey,
        activeAfter: afterQuota.activeAfter,
        extraAfter: afterQuota.extraAfter,
        extraMonthlyCostAfter: afterQuota.extraMonthlyCostAfter,
        invitedBy: ctx.profile.id,
      },
      admin,
    });
  } catch (error) {
    await admin.from("dentist_operating_hours").delete().eq("dentist_id", dentist.id);
    await admin.from("dentists").delete().eq("id", dentist.id);
    throw error instanceof Error ? error : new Error("Erro ao convidar dentista.");
  }

  revalidatePath("/configuracoes");
  revalidatePath("/agenda");
}
