"use server";

import { revalidatePath } from "next/cache";
import {
  getAuthContext,
  requireAuthContext,
  requireClinicId,
  type AuthContext,
} from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";

const SIGNATURE_BUCKET = "clinic-assets";
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024;

export type DentistProfile = {
  id: string;
  name: string;
  cro: string | null;
  specialty: string | null;
  signature_storage_path: string | null;
  signature_preview_url: string | null;
};

async function assertWritable() {
  const ctx = await getAuthContext();
  if (
    !ctx?.clinic ||
    isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)
  ) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

async function assertCanEditDentist(dentistId: string, ctx: AuthContext) {
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data: dentist, error } = await supabase
    .from("dentists")
    .select("id, clinic_id")
    .eq("id", dentistId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!dentist) throw new Error("Dentista não encontrado.");

  const isAdmin = ctx.profile.role === "clinic_admin";
  const isOwnProfile = ctx.profile.dentist_id === dentistId;

  if (!isAdmin && !isOwnProfile) {
    throw new Error("Sem permissão para editar este perfil.");
  }
}

function buildSignaturePath(clinicId: string, dentistId: string) {
  return `${clinicId}/signatures/${dentistId}.png`;
}

async function getSignaturePreviewUrl(
  storagePath: string | null,
): Promise<string | null> {
  if (!storagePath) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .createSignedUrl(storagePath, 300);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function getDentistProfile(
  dentistId: string,
): Promise<DentistProfile | null> {
  if (isDemoMockDataEnabled()) return null;

  const ctx = await requireAuthContext();
  await assertCanEditDentist(dentistId, ctx);

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentists")
    .select("id, name, cro, specialty, signature_storage_path")
    .eq("id", dentistId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    cro: data.cro,
    specialty: data.specialty,
    signature_storage_path: data.signature_storage_path,
    signature_preview_url: await getSignaturePreviewUrl(
      data.signature_storage_path,
    ),
  };
}

export async function updateDentistProfile(
  dentistId: string,
  input: { cro?: string; specialty?: string },
): Promise<DentistProfile> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Perfil dentista indisponível no modo demo.");
  }

  const ctx = await requireAuthContext();
  await assertWritable();
  await assertCanEditDentist(dentistId, ctx);

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentists")
    .update({
      cro: input.cro?.trim() || null,
      specialty: input.specialty?.trim() || null,
    })
    .eq("id", dentistId)
    .eq("clinic_id", clinicId)
    .select("id, name, cro, specialty, signature_storage_path")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/configuracoes");

  return {
    id: data.id,
    name: data.name,
    cro: data.cro,
    specialty: data.specialty,
    signature_storage_path: data.signature_storage_path,
    signature_preview_url: await getSignaturePreviewUrl(
      data.signature_storage_path,
    ),
  };
}

export async function uploadDentistSignature(
  dentistId: string,
  formData: FormData,
): Promise<DentistProfile> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Assinatura indisponível no modo demo.");
  }

  const ctx = await requireAuthContext();
  await assertWritable();
  await assertCanEditDentist(dentistId, ctx);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Selecione uma imagem PNG da assinatura.");
  }
  if (file.type !== "image/png") {
    throw new Error("A assinatura deve ser um arquivo PNG.");
  }
  if (file.size > MAX_SIGNATURE_BYTES) {
    throw new Error("A assinatura deve ter no máximo 2 MB.");
  }

  const clinicId = await requireClinicId();
  const storagePath = buildSignaturePath(clinicId, dentistId);
  const supabase = await createClient();
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(SIGNATURE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("dentists")
    .update({ signature_storage_path: storagePath })
    .eq("id", dentistId)
    .eq("clinic_id", clinicId)
    .select("id, name, cro, specialty, signature_storage_path")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/configuracoes");

  return {
    id: data.id,
    name: data.name,
    cro: data.cro,
    specialty: data.specialty,
    signature_storage_path: data.signature_storage_path,
    signature_preview_url: await getSignaturePreviewUrl(storagePath),
  };
}
