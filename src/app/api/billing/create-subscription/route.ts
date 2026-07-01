import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import {
  createAsaasSubscription,
  isAsaasConfigured,
} from "@/lib/billing/asaas";
import type { PlanKey } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  if (!isAsaasConfigured()) {
    return NextResponse.json(
      { error: "Asaas não configurado" },
      { status: 503 },
    );
  }

  const ctx = await getAuthContext();
  if (!ctx?.profile.clinic_id || ctx.profile.role !== "clinic_admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
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
    return NextResponse.json(
      { error: "Cliente Asaas não criado. Crie o customer primeiro." },
      { status: 400 },
    );
  }

  if (clinic.asaas_subscription_id) {
    return NextResponse.json({
      subscriptionId: clinic.asaas_subscription_id,
      existing: true,
    });
  }

  const subscriptionId = await createAsaasSubscription({
    customerId: clinic.asaas_customer_id,
    planKey: clinic.plan_key as PlanKey,
    firstDueDate: clinic.trial_ends_at,
  });

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Falha ao criar assinatura Asaas" },
      { status: 500 },
    );
  }

  await admin
    .from("clinics")
    .update({ asaas_subscription_id: subscriptionId })
    .eq("id", clinic.id);

  return NextResponse.json({ subscriptionId });
}
