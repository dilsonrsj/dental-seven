import type { PlanKey } from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/subscription";
import type { Dentist } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

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
};

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

  if (profile.clinic_id) {
    const { data: clinicRow } = await supabase
      .from("clinics")
      .select(
        "id, name, slug, subscription_status, trial_ends_at, plan_key",
      )
      .eq("id", profile.clinic_id)
      .maybeSingle();

    if (clinicRow) {
      clinic = clinicRow as ClinicContext;
    }

    const { data: modules } = await supabase
      .from("clinic_modules")
      .select("module_key")
      .eq("clinic_id", profile.clinic_id)
      .eq("enabled", true);

    if (modules?.length) {
      enabledModules = modules.map((m) => m.module_key);
    }

    const { data: dentistRows } = await supabase
      .from("dentists")
      .select("id, name, color")
      .eq("clinic_id", profile.clinic_id)
      .eq("active", true)
      .order("name");

    dentists = dentistRows ?? [];
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: profile as AuthProfile,
    clinic,
    enabledModules,
    dentists,
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Não autenticado");
  return ctx;
}

export async function requireClinicId(): Promise<string> {
  const ctx = await requireAuthContext();
  if (!ctx.profile.clinic_id) {
    throw new Error("Usuário sem clínica vinculada");
  }
  return ctx.profile.clinic_id;
}
