"use server";

import { revalidatePath } from "next/cache";
import {
  getAuthContext,
  requireAuthContext,
  requireClinicId,
} from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import {
  buildClinicLogoPath,
  CLINIC_LOGO_BUCKET,
  extensionFromLogoMime,
  MAX_CLINIC_LOGO_BYTES,
} from "@/lib/clinic/clinic-logo";
import { createClient } from "@/lib/supabase/server";

export type ClinicLogoSettings = {
  logo_storage_path: string | null;
  logo_preview_url: string | null;
};

async function assertClinicAdminWritable() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Clínica não encontrada.");
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Somente o administrador da clínica pode editar a logo.");
  }
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

async function getLogoPreviewUrl(
  storagePath: string | null,
): Promise<string | null> {
  if (!storagePath) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(CLINIC_LOGO_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function getClinicLogoSettings(): Promise<ClinicLogoSettings | null> {
  if (isDemoMockDataEnabled()) return null;

  const ctx = await requireAuthContext();
  if (!ctx.clinic || ctx.profile.role !== "clinic_admin") return null;

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinics")
    .select("logo_storage_path")
    .eq("id", clinicId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    logo_storage_path: data.logo_storage_path,
    logo_preview_url: await getLogoPreviewUrl(data.logo_storage_path),
  };
}

export async function uploadClinicLogo(formData: FormData): Promise<ClinicLogoSettings> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Logo indisponível no modo demo.");
  }

  await assertClinicAdminWritable();
  const clinicId = await requireClinicId();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Selecione uma imagem PNG ou JPG.");
  }

  const extension = extensionFromLogoMime(file.type);
  if (!extension) {
    throw new Error("Use PNG ou JPG para a logo da clínica.");
  }
  if (file.size > MAX_CLINIC_LOGO_BYTES) {
    throw new Error("A logo deve ter no máximo 2 MB.");
  }

  const storagePath = buildClinicLogoPath(clinicId, extension);
  const supabase = await createClient();
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(CLINIC_LOGO_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase
    .from("clinics")
    .update({ logo_storage_path: storagePath })
    .eq("id", clinicId);

  if (error) throw new Error(error.message);

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");

  return {
    logo_storage_path: storagePath,
    logo_preview_url: await getLogoPreviewUrl(storagePath),
  };
}

export async function removeClinicLogo(): Promise<ClinicLogoSettings> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Logo indisponível no modo demo.");
  }

  await assertClinicAdminWritable();
  const clinicId = await requireClinicId();
  const supabase = await createClient();

  const { data: clinic, error: fetchError } = await supabase
    .from("clinics")
    .select("logo_storage_path")
    .eq("id", clinicId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  if (clinic?.logo_storage_path) {
    const { error: removeError } = await supabase.storage
      .from(CLINIC_LOGO_BUCKET)
      .remove([clinic.logo_storage_path]);

    if (removeError) throw new Error(removeError.message);
  }

  const { error } = await supabase
    .from("clinics")
    .update({ logo_storage_path: null })
    .eq("id", clinicId);

  if (error) throw new Error(error.message);

  revalidatePath("/configuracoes");
  revalidatePath("/", "layout");

  return {
    logo_storage_path: null,
    logo_preview_url: null,
  };
}
