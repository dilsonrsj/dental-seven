/**
 * Smoke — rodapé PDF com contatos da clínica
 * Uso: npx tsx scripts/smoke-footer-pdf.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { buildClinicalPdf } from "../src/modules/prontuario/generate-clinical-pdf";

function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local opcional se variáveis já estiverem no ambiente
  }
}

loadEnvLocal();

const CLINIC_ID = "4ebb010e-2208-49a0-a722-5c90f42749f3";
const EMAIL = "v2smoke-full-20260702@test.dr7.app";
const PASSWORD = "demo2026v2";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Defina variáveis Supabase no .env.local");

  const supabase = createClient(url, anon);
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });
  if (authError) throw new Error(`Login: ${authError.message}`);

  const { data: clinic } = await supabase
    .from("clinics")
    .select(
      "name, contact_whatsapp, contact_instagram, contact_email, contact_address",
    )
    .eq("id", CLINIC_ID)
    .single();
  if (!clinic) throw new Error("Clínica não encontrada");

  const { data: dentist } = await supabase
    .from("dentists")
    .select("name, cro, specialty, signature_storage_path")
    .eq("clinic_id", CLINIC_ID)
    .limit(1)
    .single();
  if (!dentist) throw new Error("Dentista não encontrado");

  let signatureImageBytes: Uint8Array | null = null;
  if (dentist.signature_storage_path) {
    const { data: blob } = await supabase.storage
      .from("clinic-assets")
      .download(dentist.signature_storage_path);
    if (blob) signatureImageBytes = new Uint8Array(await blob.arrayBuffer());
  }

  console.log("Contatos da clínica:", {
    whatsapp: clinic.contact_whatsapp,
    instagram: clinic.contact_instagram,
    email: clinic.contact_email,
    address: clinic.contact_address,
  });

  const pdfBytes = await buildClinicalPdf({
    template: "atestado",
    clinicName: clinic.name,
    patientName: "Marina Smoke",
    dentistName: dentist.name,
    dentistCro: dentist.cro,
    dentistSpecialty: dentist.specialty,
    issuedAt: new Date(),
    daysOff: 1,
    reason: "Smoke rodapé",
    cidPatientAuthorized: false,
    cid: null,
    clinicContact: {
      whatsapp: clinic.contact_whatsapp,
      instagram: clinic.contact_instagram,
      email: clinic.contact_email,
      address: clinic.contact_address,
    },
    signatureImageBytes,
  });

  const out = "tmp-footer-smoke.pdf";
  writeFileSync(out, Buffer.from(pdfBytes));
  console.log("OK PDF", pdfBytes.byteLength, "bytes ->", out);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
