/**
 * Smoke v3.5 — documento clínico gerado + viewer + WhatsApp simulado
 * Uso: npx tsx scripts/smoke-clinical-document.ts
 */
import { createClient } from "@supabase/supabase-js";
import { buildClinicalPdf } from "../src/modules/prontuario/generate-clinical-pdf";
import { buildDocumentWhatsAppMessage } from "../src/modules/prontuario/clinical-document-whatsapp";

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";
const PATIENT_ID = "786f4632-35c1-4f4a-882f-26e4c5ac87c8";
const EMAIL = "v2smoke-full-20260702@test.dr7.app";
const PASSWORD = "demo2026v2";
const SMOKE_TITLE = "Atestado Smoke v3.5";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY");
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

  const { data: patient } = await supabase
    .from("patients")
    .select("name")
    .eq("id", PATIENT_ID)
    .eq("clinic_id", CLINIC_ID)
    .single();
  if (!patient) throw new Error("Paciente smoke não encontrado");

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name")
    .eq("id", CLINIC_ID)
    .single();
  if (!clinic) throw new Error("Clínica smoke não encontrada");

  const { data: dentist } = await supabase
    .from("dentists")
    .select("name, cro, specialty")
    .eq("clinic_id", CLINIC_ID)
    .limit(1)
    .single();
  if (!dentist) throw new Error("Dentista smoke não encontrado");

  const pdfBytes = await buildClinicalPdf({
    template: "atestado",
    clinicName: clinic.name,
    patientName: patient.name,
    dentistName: dentist.name,
    dentistCro: dentist.cro,
    dentistSpecialty: dentist.specialty,
    issuedAt: new Date(),
    daysOff: 1,
    reason: "Smoke v3.5",
  });

  if (Buffer.from(pdfBytes.subarray(0, 4)).toString("ascii") !== "%PDF") {
    throw new Error("PDF gerado inválido");
  }
  console.log("OK PDF gerado", pdfBytes.byteLength, "bytes");

  const documentId = crypto.randomUUID();
  const storagePath = `${CLINIC_ID}/${PATIENT_ID}/${documentId}/atestado-smoke-v35.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("patient-documents")
    .upload(storagePath, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadError) throw new Error(uploadError.message);
  console.log("OK storage", storagePath);

  const { data: row, error: insertError } = await supabase
    .from("patient_documents")
    .insert({
      id: documentId,
      clinic_id: CLINIC_ID,
      patient_id: PATIENT_ID,
      title: SMOKE_TITLE,
      mime_type: "application/pdf",
      storage_path: storagePath,
      file_size_bytes: pdfBytes.byteLength,
      source: "generated",
      uploaded_by: auth.user.id,
    })
    .select("id, title, source")
    .single();

  if (insertError) {
    await supabase.storage.from("patient-documents").remove([storagePath]);
    throw new Error(insertError.message);
  }
  console.log("OK patient_documents", row);

  const { data: signed, error: signError } = await supabase.storage
    .from("patient-documents")
    .createSignedUrl(storagePath, 120);
  if (signError || !signed?.signedUrl) {
    throw new Error(`Signed URL falhou: ${signError?.message}`);
  }
  console.log("OK viewer signed URL");

  let { data: thread, error: threadError } = await supabase
    .from("whatsapp_threads")
    .select("id")
    .eq("clinic_id", CLINIC_ID)
    .eq("patient_id", PATIENT_ID)
    .maybeSingle();
  if (threadError) throw new Error(threadError.message);

  if (!thread) {
    const { data: createdThread, error: createThreadError } = await supabase
      .from("whatsapp_threads")
      .insert({
        clinic_id: CLINIC_ID,
        patient_id: PATIENT_ID,
      })
      .select("id")
      .single();
    if (createThreadError || !createdThread) {
      throw new Error(createThreadError?.message ?? "Falha ao criar thread WhatsApp smoke");
    }
    thread = createdThread;
    console.log("OK thread WhatsApp criada", thread.id);
  }

  const messageBody = buildDocumentWhatsAppMessage(SMOKE_TITLE);
  const { error: messageError } = await supabase.from("whatsapp_messages").insert({
    thread_id: thread.id,
    direction: "outbound",
    body: messageBody,
    status: "sent",
  });
  if (messageError) throw new Error(messageError.message);

  await supabase
    .from("whatsapp_threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", thread.id);

  console.log("OK whatsapp simulado", messageBody);
  console.log("\nSMOKE_CLINICAL_DOCUMENT_OK");
}

main().catch((error) => {
  console.error("SMOKE_CLINICAL_DOCUMENT_FAIL", error);
  process.exit(1);
});
