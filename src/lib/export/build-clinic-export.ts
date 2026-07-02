import { createHash } from "crypto";
import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "./csv";

const EXPORT_SCHEMA_VERSION = "1.3";

const README = `Dental Seven — Exportação de dados (LGPD)
============================================

Este arquivo ZIP contém todos os dados da sua clínica na data da exportação.
Formatos: JSON (canônico) e CSV (leitura em planilhas).

A pasta documents/ inclui arquivos do prontuário (quando existirem).
patient_clinical_notes.json contém a evolução clínica registrada no prontuário.

Não inclui senhas, tokens ou dados de outras clínicas.
`;

const PATIENT_DOCUMENTS_BUCKET = "patient-documents";

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function basenameFromStoragePath(storagePath: string): string {
  const parts = storagePath.split("/");
  return parts[parts.length - 1] ?? "documento";
}

export function documentZipPath(documentId: string, storagePath: string): string {
  return `documents/${documentId}_${basenameFromStoragePath(storagePath)}`;
}

export async function buildClinicExport(clinicId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const admin = createAdminClient();

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .select(
      "id, name, slug, subscription_status, trial_ends_at, plan_key, created_at",
    )
    .eq("id", clinicId)
    .maybeSingle();

  if (clinicError || !clinic) {
    throw new Error("Clínica não encontrada.");
  }

  const [
    { data: dentists },
    { data: patients },
    { data: appointments },
    { data: threads },
    { data: patientDocuments },
    { data: clinicalNotes },
    { data: procedures },
    { data: supplies },
    { data: procedureSupplyItems },
  ] = await Promise.all([
    admin.from("dentists").select("*").eq("clinic_id", clinicId),
    admin.from("patients").select("*").eq("clinic_id", clinicId),
    admin.from("appointments").select("*").eq("clinic_id", clinicId),
    admin.from("whatsapp_threads").select("*").eq("clinic_id", clinicId),
    admin.from("patient_documents").select("*").eq("clinic_id", clinicId),
    admin.from("patient_clinical_notes").select("*").eq("clinic_id", clinicId),
    admin.from("procedures").select("*").eq("clinic_id", clinicId),
    admin.from("supplies").select("*").eq("clinic_id", clinicId),
    admin.from("procedure_supply_items").select("*").eq("clinic_id", clinicId),
  ]);

  const threadIds = (threads ?? []).map((t) => t.id);
  let messages: Record<string, unknown>[] = [];

  if (threadIds.length > 0) {
    const { data: messageRows } = await admin
      .from("whatsapp_messages")
      .select("*")
      .in("thread_id", threadIds);
    messages = messageRows ?? [];
  }

  const files: Record<string, string> = {
    "clinic.json": JSON.stringify(clinic, null, 2),
    "dentists.json": JSON.stringify(dentists ?? [], null, 2),
    "patients.json": JSON.stringify(patients ?? [], null, 2),
    "appointments.json": JSON.stringify(appointments ?? [], null, 2),
    "whatsapp_threads.json": JSON.stringify(threads ?? [], null, 2),
    "whatsapp_messages.json": JSON.stringify(messages, null, 2),
    "patient_documents.json": JSON.stringify(patientDocuments ?? [], null, 2),
    "patient_clinical_notes.json": JSON.stringify(clinicalNotes ?? [], null, 2),
    "procedures.json": JSON.stringify(procedures ?? [], null, 2),
    "supplies.json": JSON.stringify(supplies ?? [], null, 2),
    "procedure_supply_items.json": JSON.stringify(procedureSupplyItems ?? [], null, 2),
    "dentists.csv": toCsv(dentists ?? [], [
      "id",
      "name",
      "color",
      "active",
      "cro",
      "specialty",
      "signature_storage_path",
      "created_at",
    ]),
    "patients.csv": toCsv(patients ?? [], [
      "id",
      "name",
      "phone",
      "whatsapp",
      "birth_date",
      "notes",
      "created_at",
      "updated_at",
    ]),
    "appointments.csv": toCsv(appointments ?? [], [
      "id",
      "dentist_id",
      "patient_id",
      "starts_at",
      "ends_at",
      "duration_min",
      "status",
      "procedure_id",
      "procedure_label",
      "notes",
      "created_at",
    ]),
    "procedures.csv": toCsv(procedures ?? [], [
      "id",
      "name",
      "base_price_cents",
      "default_duration_min",
      "is_active",
      "created_at",
      "updated_at",
    ]),
    "supplies.csv": toCsv(supplies ?? [], [
      "id",
      "name",
      "unit_label",
      "unit_cost_cents",
      "sku",
      "is_active",
      "created_at",
      "updated_at",
    ]),
    "procedure_supply_items.csv": toCsv(procedureSupplyItems ?? [], [
      "id",
      "procedure_id",
      "supply_id",
      "quantity",
    ]),
    "patient_documents.csv": toCsv(patientDocuments ?? [], [
      "id",
      "patient_id",
      "title",
      "mime_type",
      "storage_path",
      "file_size_bytes",
      "source",
      "uploaded_by",
      "created_at",
    ]),
    "patient_clinical_notes.csv": toCsv(clinicalNotes ?? [], [
      "id",
      "patient_id",
      "appointment_id",
      "author_id",
      "body",
      "created_at",
    ]),
  };

  const documentFiles: { path: string; buffer: Buffer }[] = [];

  for (const document of patientDocuments ?? []) {
    const { data: blob, error: downloadError } = await admin.storage
      .from(PATIENT_DOCUMENTS_BUCKET)
      .download(document.storage_path);

    if (downloadError || !blob) {
      throw new Error(
        `Falha ao exportar documento ${document.id}: ${downloadError?.message ?? "arquivo ausente"}`,
      );
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    documentFiles.push({
      path: documentZipPath(document.id, document.storage_path),
      buffer,
    });
  }

  const checksums = Object.fromEntries(
    Object.entries(files).map(([name, content]) => [name, sha256(content)]),
  );

  for (const { path, buffer } of documentFiles) {
    checksums[path] = createHash("sha256").update(buffer).digest("hex");
  }

  const manifest = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    clinicId,
    clinicSlug: clinic.slug,
    counts: {
      dentists: dentists?.length ?? 0,
      patients: patients?.length ?? 0,
      appointments: appointments?.length ?? 0,
      whatsapp_threads: threads?.length ?? 0,
      whatsapp_messages: messages.length,
      patient_documents: patientDocuments?.length ?? 0,
      patient_document_files: documentFiles.length,
      patient_clinical_notes: clinicalNotes?.length ?? 0,
      procedures: procedures?.length ?? 0,
      supplies: supplies?.length ?? 0,
      procedure_supply_items: procedureSupplyItems?.length ?? 0,
    },
    checksums,
  };

  files["manifest.json"] = JSON.stringify(manifest, null, 2);
  files["README.txt"] = README;

  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  for (const { path, buffer } of documentFiles) {
    zip.file(path, buffer);
  }

  const arrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
  const filename = `dental-seven-export_${clinic.slug}_${todayKey()}.zip`;

  return {
    buffer: Buffer.from(arrayBuffer),
    filename,
  };
}
