"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext } from "@/lib/auth/context";
import {
  createAsaasCustomer,
  createAsaasSubscription,
  isAsaasConfigured,
} from "@/lib/billing/asaas";
import type { PlanKey } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export async function linkAsaasCustomer(): Promise<void> {
  if (!isAsaasConfigured()) {
    throw new Error("Asaas não configurado.");
  }

  const ctx = await requireAuthContext();
  if (!ctx.profile.clinic_id || ctx.profile.role !== "clinic_admin") {
    throw new Error("Sem permissão.");
  }

  const admin = createAdminClient();
  const { data: clinic } = await admin
    .from("clinics")
    .select("id, name, asaas_customer_id")
    .eq("id", ctx.profile.clinic_id)
    .maybeSingle();

  if (!clinic) throw new Error("Clínica não encontrada.");
  if (clinic.asaas_customer_id) return;

  try {
    const customerId = await createAsaasCustomer({
      clinicId: clinic.id,
      clinicName: clinic.name,
      email: ctx.email,
    });
    if (!customerId) {
      throw new Error("Falha ao criar cliente Asaas.");
    }
    await admin
      .from("clinics")
      .update({ asaas_customer_id: customerId })
      .eq("id", clinic.id);
    revalidatePath("/configuracoes");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Erro Asaas",
    );
  }
}

export async function createBillingSubscription(): Promise<void> {
  if (!isAsaasConfigured()) {
    throw new Error("Asaas não configurado.");
  }

  const ctx = await requireAuthContext();
  if (!ctx.profile.clinic_id || ctx.profile.role !== "clinic_admin") {
    throw new Error("Sem permissão.");
  }

  const admin = createAdminClient();
  const { data: clinic } = await admin
    .from("clinics")
    .select(
      "id, asaas_customer_id, asaas_subscription_id, plan_key, trial_ends_at",
    )
    .eq("id", ctx.profile.clinic_id)
    .maybeSingle();

  if (!clinic?.asaas_customer_id) {
    throw new Error("Vincule o Asaas primeiro.");
  }
  if (clinic.asaas_subscription_id) return;

  try {
    const subscriptionId = await createAsaasSubscription({
      customerId: clinic.asaas_customer_id,
      planKey: clinic.plan_key as PlanKey,
      firstDueDate: clinic.trial_ends_at,
    });
    if (!subscriptionId) {
      throw new Error("Falha ao criar assinatura.");
    }
    await admin
      .from("clinics")
      .update({ asaas_subscription_id: subscriptionId })
      .eq("id", clinic.id);
    revalidatePath("/configuracoes");
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Erro Asaas",
    );
  }
}
