import { createHash } from "crypto";
import JSZip from "jszip";
import { createAdminClient } from "@/lib/supabase/admin";
import { toCsv } from "./csv";

const EXPORT_SCHEMA_VERSION = "1.0";

const README = `Dental Seven — Exportação de dados (LGPD)
============================================

Este arquivo ZIP contém todos os dados da sua clínica na data da exportação.
Formatos: JSON (canônico) e CSV (leitura em planilhas).

Não inclui senhas, tokens ou dados de outras clínicas.
`;

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
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
  ] = await Promise.all([
    admin.from("dentists").select("*").eq("clinic_id", clinicId),
    admin.from("patients").select("*").eq("clinic_id", clinicId),
    admin.from("appointments").select("*").eq("clinic_id", clinicId),
    admin.from("whatsapp_threads").select("*").eq("clinic_id", clinicId),
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
    "dentists.csv": toCsv(dentists ?? [], [
      "id",
      "name",
      "color",
      "active",
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
      "procedure_label",
      "notes",
      "created_at",
    ]),
  };

  const checksums = Object.fromEntries(
    Object.entries(files).map(([name, content]) => [name, sha256(content)]),
  );

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
    },
    checksums,
  };

  files["manifest.json"] = JSON.stringify(manifest, null, 2);
  files["README.txt"] = README;

  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }

  const arrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
  const filename = `dental-seven-export_${clinic.slug}_${todayKey()}.zip`;

  return {
    buffer: Buffer.from(arrayBuffer),
    filename,
  };
}
