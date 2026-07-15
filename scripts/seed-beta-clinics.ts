/**
 * Backfill seed beta + limpa overlaps em clínicas já cadastradas.
 * Uso: npx tsx scripts/seed-beta-clinics.ts
 */
import { readFileSync } from "node:fs";
import {
  resolveOverlappingAppointmentsForAllClinics,
  seedAllClinicsMissingDemo,
} from "../src/lib/beta/seed-clinic-demo";

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
    // .env.local opcional
  }
}

async function main() {
  loadEnvLocal();

  console.log("[seed-beta] resolvendo overlaps...");
  const overlaps = await resolveOverlappingAppointmentsForAllClinics();
  const cancelled = overlaps.reduce((n, row) => n + row.cancelledIds.length, 0);
  console.log(
    `[seed-beta] overlaps: ${cancelled} consulta(s) canceladas em ${overlaps.filter((r) => r.cancelledIds.length > 0).length} clínica(s)`,
  );

  console.log("[seed-beta] seed em clínicas sem pacientes...");
  const seed = await seedAllClinicsMissingDemo();
  console.log(
    `[seed-beta] considered=${seed.considered} seeded=${seed.seeded} skipped=${seed.skipped} failures=${seed.failures.length}`,
  );
  for (const failure of seed.failures) {
    console.error(`  fail ${failure.clinicId}: ${failure.error}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
