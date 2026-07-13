"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  defaultModuleEnabled,
  type PlanKey,
} from "@/lib/billing/plans";
import { trialEndsAtFromNow } from "@/lib/billing/subscription";
import {
  createAsaasCustomer,
  createAsaasSubscription,
  isAsaasConfigured,
} from "@/lib/billing/asaas";
import { isBetaGateEnabled, linkFounderToClinic } from "@/lib/founding/gate";
import { resolveSignupPlanKey } from "@/lib/auth/signup-plan";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || `clinica-${Date.now()}`;
}

export type SignupInput = {
  clinicName: string;
  adminName: string;
  email: string;
  password: string;
  planKey: PlanKey;
  acceptedTerms: boolean;
};

export type SignupResult =
  | { ok: true }
  | { ok: false; error: string };

export type AcceptTermsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function acceptTerms(input: {
  acceptedTerms: boolean;
}): Promise<AcceptTermsResult> {
  if (!input.acceptedTerms) {
    return {
      ok: false,
      error: "Você precisa aceitar os Termos de Uso e a Política de Privacidade.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão inválida. Abra o link do convite novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signupClinic(input: SignupInput): Promise<SignupResult> {
  const clinicName = input.clinicName.trim();
  const adminName = input.adminName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (clinicName.length < 2) {
    return { ok: false, error: "Nome da clínica muito curto." };
  }
  if (adminName.length < 2) {
    return { ok: false, error: "Nome do responsável muito curto." };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "E-mail inválido." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Senha deve ter pelo menos 8 caracteres." };
  }
  if (!input.acceptedTerms) {
    return {
      ok: false,
      error: "Você precisa aceitar os Termos de Uso e a Política de Privacidade.",
    };
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

  const baseSlug = slugify(clinicName);
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const { data: existing } = await admin
      .from("clinics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return {
      ok: false,
      error: authError?.message ?? "Não foi possível criar a conta.",
    };
  }

  const userId = authData.user.id;
  const trialEndsAt = trialEndsAtFromNow(7);
  const planKey = resolveSignupPlanKey(input.planKey, isBetaGateEnabled());

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .insert({
      name: clinicName,
      slug,
      subscription_status: "trialing",
      trial_ends_at: trialEndsAt,
      plan_key: planKey,
    })
    .select("id")
    .single();

  if (clinicError || !clinic) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: clinicError?.message ?? "Erro ao criar clínica." };
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

  const termsAcceptedAt = new Date().toISOString();
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    role: "clinic_admin",
    clinic_id: clinic.id,
    dentist_id: dentist.id,
    full_name: adminName,
    terms_accepted_at: termsAcceptedAt,
  });

  if (profileError) {
    await admin.from("dentists").delete().eq("id", dentist.id);
    await admin.from("clinics").delete().eq("id", clinic.id);
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: profileError.message };
  }

  const moduleRows = Array.from(
    new Set(
      ["agenda", "pacientes", "whatsapp", "ai_agent", "prontuario", "procedimentos", "estoque", "financeiro", "fornecedores", "convenios"],
    ),
  ).map((moduleKey) => ({
    clinic_id: clinic.id,
    module_key: moduleKey,
    enabled: defaultModuleEnabled(planKey, moduleKey as never),
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

  if (isAsaasConfigured()) {
    try {
      const customerId = await createAsaasCustomer({
        clinicId: clinic.id,
        clinicName,
        email,
      });
      if (customerId) {
        const subscriptionId = await createAsaasSubscription({
          customerId,
          planKey,
          firstDueDate: trialEndsAt,
        });
        await admin
          .from("clinics")
          .update({
            asaas_customer_id: customerId,
            asaas_subscription_id: subscriptionId,
          })
          .eq("id", clinic.id);
      }
    } catch (err) {
      console.error("[signup] Asaas setup failed:", err);
    }
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      ok: false,
      error:
        "Conta criada, mas falha ao entrar. Use /entrar com seu e-mail e senha.",
    };
  }

  await linkFounderToClinic(email, clinic.id);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
