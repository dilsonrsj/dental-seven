import type { PlanKey } from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/subscription";
import type { Dentist } from "@/lib/supabase/types";
import {
  IMPERSONATION_COOKIE,
  isImpersonationValid,
  parseImpersonationCookie,
} from "@/modules/admin/impersonation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export type UserRole = "super_admin" | "clinic_admin" | "dentist";

export type AuthProfile = {
  id: string;
  role: UserRole;
  clinic_id: string | null;
  dentist_id: string | null;
  full_name: string;
};

export type ClinicContext = {
  id: string;
  name: string;
  slug: string;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  plan_key: PlanKey;
};

export type AuthContext = {
  userId: string;
  email: string;
  profile: AuthProfile;
  clinic: ClinicContext | null;
  enabledModules: string[];
  dentists: Pick<Dentist, "id" | "name" | "color">[];
  isImpersonating?: boolean;
};

export type AuthContextWithClinic = AuthContext & { clinic: ClinicContext };

export function assertClinicContext(ctx: AuthContext): AuthContextWithClinic {
  if (!ctx.clinic) throw new Error("Usuário sem clínica vinculada");
  return ctx as AuthContextWithClinic;
}

async function loadClinicContext(
  clinicId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{
  clinic: ClinicContext | null;
  enabledModules: string[];
  dentists: Pick<Dentist, "id" | "name" | "color">[];
}> {
  const { data: clinicRow } = await supabase
    .from("clinics")
    .select(
      "id, name, slug, subscription_status, trial_ends_at, plan_key",
    )
    .eq("id", clinicId)
    .maybeSingle();

  const clinic = clinicRow ? (clinicRow as ClinicContext) : null;

  const { data: modules } = await supabase
    .from("clinic_modules")
    .select("module_key")
    .eq("clinic_id", clinicId)
    .eq("enabled", true);

  const enabledModules = modules?.length
    ? modules.map((m) => m.module_key)
    : ["agenda", "pacientes"];

  const { data: dentistRows } = await supabase
    .from("dentists")
    .select("id, name, color")
    .eq("clinic_id", clinicId)
    .eq("active", true)
    .order("name");

  return {
    clinic,
    enabledModules,
    dentists: dentistRows ?? [],
  };
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, clinic_id, dentist_id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) return null;

  let clinic: ClinicContext | null = null;
  let enabledModules: string[] = ["agenda", "pacientes"];
  let dentists: Pick<Dentist, "id" | "name" | "color">[] = [];
  let isImpersonating = false;

  if (profile.role === "super_admin") {
    const cookieStore = await cookies();
    const payload = parseImpersonationCookie(
      cookieStore.get(IMPERSONATION_COOKIE)?.value,
    );

    if (payload && isImpersonationValid(payload, user.id)) {
      isImpersonating = true;
      const admin = createAdminClient();
      const { data: clinicRow } = await admin
        .from("clinics")
        .select(
          "id, name, slug, subscription_status, trial_ends_at, plan_key",
        )
        .eq("id", payload.clinicId)
        .maybeSingle();

      if (clinicRow) {
        clinic = clinicRow as ClinicContext;

        const { data: modules } = await admin
          .from("clinic_modules")
          .select("module_key")
          .eq("clinic_id", payload.clinicId)
          .eq("enabled", true);

        if (modules?.length) {
          enabledModules = modules.map((m) => m.module_key);
        }

        const { data: dentistRows } = await admin
          .from("dentists")
          .select("id, name, color")
          .eq("clinic_id", payload.clinicId)
          .eq("active", true)
          .order("name");

        dentists = dentistRows ?? [];
      }
    }
  } else if (profile.clinic_id) {
    const loaded = await loadClinicContext(profile.clinic_id, supabase);
    clinic = loaded.clinic;
    enabledModules = loaded.enabledModules;
    dentists = loaded.dentists;
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile as AuthProfile,
    clinic,
    enabledModules,
    dentists,
    isImpersonating,
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Não autenticado");
  return ctx;
}

export async function requireClinicId(): Promise<string> {
  const ctx = await requireAuthContext();
  if (!ctx.clinic?.id) {
    throw new Error("Usuário sem clínica vinculada");
  }
  return ctx.clinic.id;
}
