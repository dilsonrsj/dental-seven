"use server";

import { revalidatePath } from "next/cache";
import {
  getAuthContext,
  requireAuthContext,
  requireClinicId,
} from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";

export type ClinicContactSettings = {
  contact_whatsapp: string | null;
  contact_instagram: string | null;
  contact_email: string | null;
  contact_address: string | null;
};

async function assertClinicAdminWritable() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Clínica não encontrada.");
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Somente o administrador da clínica pode editar contatos.");
  }
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

export async function getClinicContactSettings(): Promise<ClinicContactSettings | null> {
  if (isDemoMockDataEnabled()) return null;

  const ctx = await requireAuthContext();
  if (!ctx.clinic || ctx.profile.role !== "clinic_admin") return null;

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select(
      "contact_whatsapp, contact_instagram, contact_email, contact_address",
    )
    .eq("id", clinicId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    contact_whatsapp: data.contact_whatsapp,
    contact_instagram: data.contact_instagram,
    contact_email: data.contact_email,
    contact_address: data.contact_address,
  };
}

export async function updateClinicContactSettings(input: {
  contact_whatsapp?: string;
  contact_instagram?: string;
  contact_email?: string;
  contact_address?: string;
}): Promise<void> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Indisponível no modo demo.");
  }

  await assertClinicAdminWritable();
  const clinicId = await requireClinicId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("clinics")
    .update({
      contact_whatsapp: input.contact_whatsapp?.trim() || null,
      contact_instagram: input.contact_instagram?.trim() || null,
      contact_email: input.contact_email?.trim() || null,
      contact_address: input.contact_address?.trim() || null,
    })
    .eq("id", clinicId);

  if (error) throw new Error(error.message);

  revalidatePath("/configuracoes");
}
