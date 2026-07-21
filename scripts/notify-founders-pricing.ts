/**
 * Envia e-mail de anúncio da precificação founding para beta_founders (exclui seeds).
 *
 * Uso (com RESEND_API_KEY e env do projeto):
 *   npx tsx scripts/notify-founders-pricing.ts
 *   npx tsx scripts/notify-founders-pricing.ts --dry-run
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { notifyFounderPricingAnnouncement } from "../src/lib/email/founders-pricing-announce";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const dryRun = process.argv.includes("--dry-run");

const SKIP_EMAIL_SUBSTRINGS = [
  "smoke",
  "test.dr7",
  "@dr7.app",
  "dilsonrsj@",
  "dilsonramos@",
];

function shouldNotify(email: string): boolean {
  const lower = email.toLowerCase();
  return !SKIP_EMAIL_SUBSTRINGS.some((s) => lower.includes(s));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("beta_founders")
    .select("full_name, email")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const recipients = (data ?? []).filter((row) => shouldNotify(row.email));
  console.log(
    dryRun
      ? `[dry-run] ${recipients.length} destinatário(s)`
      : `Enviando para ${recipients.length} founding member(s)…`,
  );

  for (const row of recipients) {
    console.log(`- ${row.full_name} <${row.email}>`);
    if (dryRun) continue;
    const result = await notifyFounderPricingAnnouncement({
      to: row.email,
      fullName: row.full_name,
    });
    console.log(result.skipped ? "  (stub — sem RESEND_API_KEY)" : "  ok");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
