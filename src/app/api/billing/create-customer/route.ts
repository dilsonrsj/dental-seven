import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import {
  createAsaasCustomer,
  isAsaasConfigured,
} from "@/lib/billing/asaas";
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
    .select("id, name, asaas_customer_id, plan_key, trial_ends_at")
    .eq("id", ctx.profile.clinic_id)
    .maybeSingle();

  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  let customerId = clinic.asaas_customer_id;

  if (!customerId) {
    customerId = await createAsaasCustomer({
      clinicId: clinic.id,
      clinicName: clinic.name,
      email: ctx.email,
    });

    if (!customerId) {
      return NextResponse.json(
        { error: "Falha ao criar cliente Asaas" },
        { status: 500 },
      );
    }

    await admin
      .from("clinics")
      .update({ asaas_customer_id: customerId })
      .eq("id", clinic.id);
  }

  return NextResponse.json({ customerId });
}
