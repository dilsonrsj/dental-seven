/**
 * Smoke v2.5 — prontuário (auth real + Storage + export LGPD)
 * Uso: npx tsx scripts/smoke-prontuario.ts
 */
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import JSZip from "jszip";
import { createClient } from "@supabase/supabase-js";
import { buildClinicExport } from "../src/lib/export/build-clinic-export";

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";
const PATIENT_ID = "786f4632-35c1-4f4a-882f-26e4c5ac87c8";
const EMAIL = "v2smoke-full-20260702@test.dr7.app";
const PASSWORD = "demo2026v2";
const PDF_PATH = "scripts/fixtures/laudo-smoke.pdf";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !serviceKey) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL, ANON_KEY e SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, anon);
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authError || !auth.user) {
    throw new Error(`Login falhou: ${authError?.message}`);
  }
  console.log("OK login", auth.user.email);

  const pdf = readFileSync(PDF_PATH);
  const documentId = randomUUID();
  const storagePath = `${CLINIC_ID}/${PATIENT_ID}/${documentId}/laudo-smoke.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("patient-documents")
    .upload(storagePath, pdf, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    throw new Error(`Upload storage falhou: ${uploadError.message}`);
  }
  console.log("OK storage upload", storagePath);

  const { data: row, error: insertError } = await supabase
    .from("patient_documents")
    .insert({
      id: documentId,
      clinic_id: CLINIC_ID,
      patient_id: PATIENT_ID,
      title: "Laudo Smoke v2.5",
      mime_type: "application/pdf",
      storage_path: storagePath,
      file_size_bytes: pdf.length,
      source: "imported",
      uploaded_by: auth.user.id,
    })
    .select("id, title")
    .single();

  if (insertError) {
    await supabase.storage.from("patient-documents").remove([storagePath]);
    throw new Error(`Insert falhou: ${insertError.message}`);
  }
  console.log("OK patient_documents", row);

  const { data: list, error: listError } = await supabase
    .from("patient_documents")
    .select("id, title")
    .eq("clinic_id", CLINIC_ID)
    .eq("patient_id", PATIENT_ID)
    .order("created_at", { ascending: false });

  if (listError) throw new Error(listError.message);
  const found = list?.some((d) => d.id === documentId);
  if (!found) throw new Error("Documento não aparece na listagem");
  console.log("OK listagem", list?.length, "documento(s)");

  const { data: signed, error: signError } = await supabase.storage
    .from("patient-documents")
    .createSignedUrl(storagePath, 60);

  if (signError || !signed?.signedUrl) {
    throw new Error(`Signed URL falhou: ${signError?.message}`);
  }
  console.log("OK signed download URL");

  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  const { buffer, filename } = await buildClinicExport(CLINIC_ID);
  if (buffer.length < 100) throw new Error("ZIP export muito pequeno");

  const zip = await JSZip.loadAsync(buffer);
  const zipFiles = Object.keys(zip.files).filter((name) => !name.endsWith("/"));
  for (const required of [
    "patient_documents.json",
    "patient_clinical_notes.json",
    "patient_clinical_notes.csv",
  ]) {
    if (!zipFiles.includes(required)) {
      throw new Error(`Export ZIP sem ${required}`);
    }
  }
  const manifest = JSON.parse(
    (await zip.file("manifest.json")?.async("string")) ?? "{}",
  );
  if (manifest.schemaVersion !== "1.2") {
    throw new Error(`schemaVersion inesperado: ${manifest.schemaVersion}`);
  }
  console.log(
    "OK export LGPD",
    filename,
    buffer.length,
    "bytes",
    `| notas: ${manifest.counts?.patient_clinical_notes ?? 0}`,
  );

  console.log("\nSMOKE_PRONTUARIO_OK");
}

main().catch((error) => {
  console.error("SMOKE_PRONTUARIO_FAIL", error);
  process.exit(1);
});
