/**
 * Configura .env.local e aplica migrations no projeto Dental Seven (Supabase remoto).
 * Usa PAT de ~/.cursor/secrets/supabase/access-token.txt
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_REF = "gspkjgeemerhmzvfxinv";
const secretsDir = path.join(os.homedir(), ".cursor", "secrets", "supabase");
const token = fs.readFileSync(path.join(secretsDir, "access-token.txt"), "utf8").trim();
const root = process.cwd();

async function api(pathname, options = {}) {
  const res = await fetch(`https://api.supabase.com/v1${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function runSql(query) {
  return api(`/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

async function main() {
  console.log("=== Setup Supabase — Dental Seven ===\n");

  const keys = await api(`/projects/${PROJECT_REF}/api-keys`);
  const anon = keys.find((k) => k.name === "anon" || k.name === "anon key")?.api_key
    ?? keys.find((k) => k.tags?.includes("anon"))?.api_key;
  if (!anon) {
    console.error("Chaves disponíveis:", keys.map((k) => k.name).join(", "));
    throw new Error("Anon key não encontrada");
  }

  const url = `https://${PROJECT_REF}.supabase.co`;
  const envPath = path.join(root, ".env.local");
  const envContent = `NEXT_PUBLIC_APP_NAME=Dental Seven
DEMO_PASSWORD=demo2026

NEXT_PUBLIC_SUPABASE_URL=${url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}
`;
  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("✅ .env.local atualizado");

  for (const file of ["001_core_schema.sql", "002_seed_demo.sql"]) {
    const sql = fs.readFileSync(
      path.join(root, "supabase", "migrations", file),
      "utf8",
    );
    console.log(`⏳ Aplicando ${file}...`);
    await runSql(sql);
    console.log(`✅ ${file} aplicado`);
  }

  const check = await runSql(
    "select (select count(*) from patients) as patients, (select count(*) from appointments) as appointments;",
  );
  console.log("\n✅ Seed verificado:", check);
  console.log("\nReinicie npm run dev se estiver rodando.");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
