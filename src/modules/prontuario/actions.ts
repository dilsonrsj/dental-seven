"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getAuthContext, requireAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";
import type { PatientDocumentListItem } from "./types";
import { assertAllowedUpload } from "./validation";
import {
  buildDocumentTitle,
  type ClinicalDocumentFormInput,
  toClinicalPdfPayload,
} from "./clinical-document-input";
import { buildClinicalPdf } from "./generate-clinical-pdf";
import { buildDocumentWhatsAppMessage } from "./clinical-document-whatsapp";

const STORAGE_BUCKET = "patient-documents";
const SIGNATURE_BUCKET = "clinic-assets";

async function assertWritable() {
  const ctx = await getAuthContext();
  if (
    !ctx?.clinic ||
    isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)
  ) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

async function assertProntuarioModule() {
  const ctx = await requireAuthContext();
  if (!ctx.enabledModules.includes("prontuario")) {
    throw new Error("Módulo Prontuário não disponível no seu plano.");
  }
  return ctx;
}

async function requirePatientInClinic(patientId: string, clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("id", patientId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Paciente não encontrado.");
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "documento";
  const cleaned = base.replace(/[^\w.\-() áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]+/g, "_");
  return cleaned.slice(0, 120) || "documento";
}

function titleFromUpload(file: File, customTitle?: string | null): string {
  const trimmed = customTitle?.trim();
  if (trimmed) return trimmed.slice(0, 200);
  const withoutExt = file.name.replace(/\.[^.]+$/, "");
  return sanitizeFilename(withoutExt) || "Documento";
}

function buildStoragePath(
  clinicId: string,
  patientId: string,
  documentId: string,
  filename: string,
): string {
  return `${clinicId}/${patientId}/${documentId}/${filename}`;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type DocumentRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  title: string;
  mime_type: string;
  storage_path: string;
  file_size_bytes: number;
  source: "imported" | "generated" | "clinical";
  uploaded_by: string | null;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

function mapDocumentRow(row: DocumentRow): PatientDocumentListItem {
  const author = firstRelation(row.profiles);
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    patient_id: row.patient_id,
    title: row.title,
    mime_type: row.mime_type,
    storage_path: row.storage_path,
    file_size_bytes: row.file_size_bytes,
    source: row.source,
    uploaded_by: row.uploaded_by,
    created_at: row.created_at,
    uploader_name: author?.full_name ?? null,
  };
}

export async function listPatientDocuments(
  patientId: string,
): Promise<PatientDocumentListItem[]> {
  if (isDemoMockDataEnabled()) {
    return [];
  }

  await assertProntuarioModule();
  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_documents")
    .select(
      `
        id,
        clinic_id,
        patient_id,
        title,
        mime_type,
        storage_path,
        file_size_bytes,
        source,
        uploaded_by,
        created_at,
        profiles ( full_name )
      `,
    )
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapDocumentRow(row as DocumentRow));
}

export async function uploadPatientDocument(
  patientId: string,
  formData: FormData,
): Promise<PatientDocumentListItem> {
  if (isDemoMockDataEnabled()) {
    throw new Error(
      "Upload de prontuário disponível com Supabase e plano Completo.",
    );
  }

  await assertWritable();
  const ctx = await assertProntuarioModule();
  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Selecione um arquivo para enviar.");
  }

  assertAllowedUpload({ type: file.type, size: file.size });

  const documentId = randomUUID();
  const filename = sanitizeFilename(file.name);
  const storagePath = buildStoragePath(
    clinicId,
    patientId,
    documentId,
    filename,
  );
  const title = titleFromUpload(
    file,
    formData.get("title")?.toString() ?? null,
  );

  const supabase = await createClient();
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data, error } = await supabase
    .from("patient_documents")
    .insert({
      id: documentId,
      clinic_id: clinicId,
      patient_id: patientId,
      title,
      mime_type: file.type,
      storage_path: storagePath,
      file_size_bytes: file.size,
      source: "imported",
      uploaded_by: ctx.profile.id,
    })
    .select(
      `
        id,
        clinic_id,
        patient_id,
        title,
        mime_type,
        storage_path,
        file_size_bytes,
        source,
        uploaded_by,
        created_at,
        profiles ( full_name )
      `,
    )
    .single();

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }

  revalidatePath(`/pacientes/${patientId}/prontuario`);
  revalidatePath(`/pacientes/${patientId}`);

  return mapDocumentRow(data as DocumentRow);
}

export async function getDocumentDownloadUrl(
  documentId: string,
  ttlSeconds = 60,
): Promise<string> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Download indisponível no modo demo.");
  }

  await assertProntuarioModule();
  const clinicId = await requireClinicId();
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("patient_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!document) throw new Error("Documento não encontrado.");

  const { data: signed, error: signError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(document.storage_path, ttlSeconds);

  if (signError) throw new Error(signError.message);
  if (!signed?.signedUrl) throw new Error("Não foi possível gerar o download.");

  return signed.signedUrl;
}

type ClinicalGenerationContext = {
  clinicName: string;
  patientName: string;
  dentistName: string;
  dentistCro: string | null;
  dentistSpecialty: string | null;
  signatureImageBytes: Uint8Array | null;
};

async function resolveClinicalGenerationContext(
  patientId: string,
): Promise<ClinicalGenerationContext> {
  const ctx = await assertProntuarioModule();
  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  if (!ctx.clinic) {
    throw new Error("Clínica não encontrada.");
  }

  const dentistId = ctx.profile.dentist_id ?? ctx.dentists[0]?.id;
  if (!dentistId) {
    throw new Error("Nenhum dentista vinculado à clínica.");
  }

  const supabase = await createClient();
  const [{ data: patient }, { data: dentist }] = await Promise.all([
    supabase
      .from("patients")
      .select("name")
      .eq("id", patientId)
      .eq("clinic_id", clinicId)
      .single(),
    supabase
      .from("dentists")
      .select("name, cro, specialty, signature_storage_path")
      .eq("id", dentistId)
      .eq("clinic_id", clinicId)
      .single(),
  ]);

  if (!patient || !dentist) {
    throw new Error("Não foi possível carregar dados para o documento.");
  }

  let signatureImageBytes: Uint8Array | null = null;
  if (dentist.signature_storage_path) {
    const { data: signatureBlob } = await supabase.storage
      .from(SIGNATURE_BUCKET)
      .download(dentist.signature_storage_path);
    if (signatureBlob) {
      signatureImageBytes = new Uint8Array(await signatureBlob.arrayBuffer());
    }
  }

  return {
    clinicName: ctx.clinic.name,
    patientName: patient.name,
    dentistName: dentist.name,
    dentistCro: dentist.cro,
    dentistSpecialty: dentist.specialty,
    signatureImageBytes,
  };
}

export async function previewClinicalDocument(
  patientId: string,
  input: ClinicalDocumentFormInput,
): Promise<{ title: string; pdfBase64: string }> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Documentos clínicos indisponíveis no modo demo.");
  }

  await assertProntuarioModule();
  const context = await resolveClinicalGenerationContext(patientId);
  const payload = toClinicalPdfPayload(input, context);
  const pdfBytes = await buildClinicalPdf(payload);
  const title = buildDocumentTitle(input, context.patientName);

  return {
    title,
    pdfBase64: Buffer.from(pdfBytes).toString("base64"),
  };
}

export async function generateClinicalDocument(
  patientId: string,
  input: ClinicalDocumentFormInput,
): Promise<PatientDocumentListItem> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Documentos clínicos indisponíveis no modo demo.");
  }

  await assertWritable();
  const ctx = await assertProntuarioModule();
  const clinicId = await requireClinicId();
  const context = await resolveClinicalGenerationContext(patientId);
  const payload = toClinicalPdfPayload(input, context);
  const pdfBytes = await buildClinicalPdf(payload);
  const title = buildDocumentTitle(input, context.patientName);

  const documentId = randomUUID();
  const filename = `${input.template}-${documentId.slice(0, 8)}.pdf`;
  const storagePath = buildStoragePath(clinicId, patientId, documentId, filename);
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("patient_documents")
    .insert({
      id: documentId,
      clinic_id: clinicId,
      patient_id: patientId,
      title,
      mime_type: "application/pdf",
      storage_path: storagePath,
      file_size_bytes: pdfBytes.byteLength,
      source: "generated",
      uploaded_by: ctx.profile.id,
    })
    .select(
      `
        id,
        clinic_id,
        patient_id,
        title,
        mime_type,
        storage_path,
        file_size_bytes,
        source,
        uploaded_by,
        created_at,
        profiles ( full_name )
      `,
    )
    .single();

  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }

  revalidatePath(`/pacientes/${patientId}/prontuario`);
  revalidatePath(`/pacientes/${patientId}`);

  return mapDocumentRow(data as DocumentRow);
}

export async function sendDocumentToWhatsAppThread(
  patientId: string,
  documentId: string,
): Promise<{ threadId: string }> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Envio simulado indisponível no modo demo.");
  }

  await assertWritable();
  await assertProntuarioModule();
  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase
    .from("patient_documents")
    .select("id, title, patient_id")
    .eq("id", documentId)
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (documentError) throw new Error(documentError.message);
  if (!document) throw new Error("Documento não encontrado.");

  const { data: thread, error: threadError } = await supabase
    .from("whatsapp_threads")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (threadError) throw new Error(threadError.message);
  if (!thread) {
    throw new Error("Paciente sem conversa WhatsApp. Abra o módulo WhatsApp primeiro.");
  }

  const body = buildDocumentWhatsAppMessage(document.title);
  const { error: messageError } = await supabase.from("whatsapp_messages").insert({
    thread_id: thread.id,
    direction: "outbound",
    body,
    status: "sent",
  });

  if (messageError) throw new Error(messageError.message);

  const { error: updateThreadError } = await supabase
    .from("whatsapp_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", thread.id)
    .eq("clinic_id", clinicId);

  if (updateThreadError) throw new Error(updateThreadError.message);

  revalidatePath("/whatsapp");
  revalidatePath(`/pacientes/${patientId}/prontuario`);

  return { threadId: thread.id };
}
