"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthContext } from "@/lib/auth/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function requireSuperAdmin() {
  const ctx = await requireAuthContext();
  if (ctx.profile.role !== "super_admin") {
    redirect("/agenda");
  }
  return ctx;
}

export async function listClinicsForAdmin() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clinics")
    .select(
      "id, name, slug, subscription_status, plan_key, trial_ends_at, deleted_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClinicForAdmin(clinicId: string) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { data: clinic, error } = await admin
    .from("clinics")
    .select(
      "id, name, slug, subscription_status, plan_key, trial_ends_at, deleted_at",
    )
    .eq("id", clinicId)
    .maybeSingle();

  if (error || !clinic) throw new Error("Clínica não encontrada");

  const { data: modules } = await admin
    .from("clinic_modules")
    .select("module_key, enabled")
    .eq("clinic_id", clinicId)
    .order("module_key");

  return { clinic, modules: modules ?? [] };
}

export async function toggleClinicModule(
  clinicId: string,
  moduleKey: string,
  enabled: boolean,
) {
  await requireSuperAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("clinic_modules")
    .update({ enabled })
    .eq("clinic_id", clinicId)
    .eq("module_key", moduleKey);

  if (error) throw new Error(error.message);
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
