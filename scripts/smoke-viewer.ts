/**
 * Smoke v3.5 — viewer modal (signed URL + PDF previewável)
 * Uso: npx tsx scripts/smoke-viewer.ts
 *
 * Pré-requisito: documento "Laudo Smoke v2.5" no paciente smoke
 * (rode scripts/smoke-prontuario.ts antes, se necessário).
 */
import { createClient } from "@supabase/supabase-js";

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";
const PATIENT_ID = "786f4632-35c1-4f4a-882f-26e4c5ac87c8";
const EMAIL = "v2smoke-full-20260702@test.dr7.app";
const PASSWORD = "demo2026v2";
const SMOKE_TITLE = "Laudo Smoke v2.5";
const VIEWER_TTL_SECONDS = 120;

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

  const { data: document, error: docError } = await supabase
    .from("patient_documents")
    .select("id, title, mime_type, storage_path")
    .eq("clinic_id", CLINIC_ID)
    .eq("patient_id", PATIENT_ID)
    .eq("title", SMOKE_TITLE)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (docError) throw new Error(docError.message);
  if (!document) {
    throw new Error(
      `Documento "${SMOKE_TITLE}" não encontrado. Rode: npx tsx scripts/smoke-prontuario.ts`,
    );
  }
  console.log("OK documento", document.id, document.title);

  if (document.mime_type !== "application/pdf") {
    throw new Error(`mime_type inesperado: ${document.mime_type}`);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("patient-documents")
    .createSignedUrl(document.storage_path, VIEWER_TTL_SECONDS);

  if (signError || !signed?.signedUrl) {
    throw new Error(`Signed URL falhou: ${signError?.message}`);
  }
  console.log("OK signed preview URL (TTL", VIEWER_TTL_SECONDS, "s)");

  const response = await fetch(signed.signedUrl);
  if (!response.ok) {
    throw new Error(`Fetch preview falhou: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
    throw new Error(`Content-Type inesperado: ${contentType}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 100) {
    throw new Error("PDF muito pequeno para preview");
  }
  if (buffer.subarray(0, 4).toString("ascii") !== "%PDF") {
    throw new Error("Conteúdo não é PDF válido");
  }
  console.log("OK PDF previewável", buffer.length, "bytes");

  console.log("\nSMOKE_VIEWER_OK");
  console.log(
    `UI manual: /pacientes/${PATIENT_ID}/prontuario → Visualizar "${SMOKE_TITLE}"`,
  );
}

main().catch((error) => {
  console.error("SMOKE_VIEWER_FAIL", error);
  process.exit(1);
});
