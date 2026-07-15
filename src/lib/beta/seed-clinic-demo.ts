import { createAdminClient } from "@/lib/supabase/admin";
import { pickOverlappingIdsToCancel } from "@/modules/agenda/appointment-overlap";

export type SeedClinicDemoCounts = {
  patients: number;
  procedures: number;
  supplies: number;
  appointments: number;
  financialEntries: number;
  suppliers: number;
  insuranceCarriers: number;
};

/** Payload counts for beta clinic bootstrap (unit-testable). */
export const BETA_SEED_COUNTS: SeedClinicDemoCounts = {
  patients: 10,
  procedures: 10,
  supplies: 12,
  appointments: 12,
  financialEntries: 8,
  suppliers: 4,
  insuranceCarriers: 3,
};

type SeedPatient = {
  name: string;
  phone: string;
  whatsapp: string;
  birth_date: string;
  notes: string;
};

type SeedProcedure = {
  name: string;
  base_price_cents: number;
  default_duration_min: number;
};

type SeedSupply = {
  name: string;
  unit_label: string;
  unit_cost_cents: number;
  quantity_on_hand: number;
  min_quantity: number;
  sku: string;
};

const PATIENTS: SeedPatient[] = [
  {
    name: "Marina Costa",
    phone: "(11) 98765-4321",
    whatsapp: "5511987654321",
    birth_date: "1990-03-15",
    notes: "Beta: paciente fictícia. Prefere manhã.",
  },
  {
    name: "João Pereira",
    phone: "(11) 97654-3210",
    whatsapp: "5511976543210",
    birth_date: "1985-07-22",
    notes: "Beta: retorno periódico a cada 6 meses.",
  },
  {
    name: "Fernanda Lima",
    phone: "(11) 96543-2109",
    whatsapp: "5511965432109",
    birth_date: "1992-11-08",
    notes: "Beta: interesse em clareamento.",
  },
  {
    name: "Lucas Oliveira",
    phone: "(11) 95432-1098",
    whatsapp: "5511954321098",
    birth_date: "1978-01-30",
    notes: "Beta: aparelho removível em uso.",
  },
  {
    name: "Beatriz Santos",
    phone: "(11) 94321-0987",
    whatsapp: "5511943210987",
    birth_date: "1995-05-12",
    notes: "Beta: contato preferencial via WhatsApp.",
  },
  {
    name: "Rafael Souza",
    phone: "(11) 93210-9876",
    whatsapp: "5511932109876",
    birth_date: "1988-09-25",
    notes: "Beta: flexível no horário da tarde.",
  },
  {
    name: "Camila Rodrigues",
    phone: "(11) 92109-8765",
    whatsapp: "5511921098765",
    birth_date: "1998-12-03",
    notes: "Beta: disponível após 14h.",
  },
  {
    name: "Pedro Almeida",
    phone: "(11) 91098-7654",
    whatsapp: "5511910987654",
    birth_date: "1982-04-18",
    notes: "Beta: avaliação ortodôntica pendente.",
  },
  {
    name: "Ana Paula Vieira",
    phone: "(11) 90987-6543",
    whatsapp: "5511909876543",
    birth_date: "1991-06-20",
    notes: "Beta: sensibilidade ao frio.",
  },
  {
    name: "Thiago Nogueira",
    phone: "(11) 89876-5432",
    whatsapp: "5511898765432",
    birth_date: "1987-02-11",
    notes: "Beta: indicado por Marina Costa.",
  },
];

const PROCEDURES: SeedProcedure[] = [
  { name: "Consulta / Avaliação", base_price_cents: 15000, default_duration_min: 30 },
  { name: "Limpeza (profilaxia)", base_price_cents: 22000, default_duration_min: 45 },
  { name: "Restauração em resina", base_price_cents: 28000, default_duration_min: 60 },
  { name: "Clareamento (sessão)", base_price_cents: 45000, default_duration_min: 60 },
  { name: "Extração simples", base_price_cents: 32000, default_duration_min: 45 },
  { name: "Aplicação de flúor", base_price_cents: 8000, default_duration_min: 20 },
  { name: "Radiografia periapical", base_price_cents: 6000, default_duration_min: 15 },
  { name: "Tratamento de canal (sessão)", base_price_cents: 55000, default_duration_min: 90 },
  { name: "Prótese unitária (prova)", base_price_cents: 38000, default_duration_min: 60 },
  { name: "Manutenção ortodôntica", base_price_cents: 18000, default_duration_min: 30 },
];

const SUPPLIES: SeedSupply[] = [
  {
    name: "Luvas de procedimento",
    unit_label: "cx",
    unit_cost_cents: 2800,
    quantity_on_hand: 12,
    min_quantity: 3,
    sku: "INS-LUV-01",
  },
  {
    name: "Máscara cirúrgica",
    unit_label: "cx",
    unit_cost_cents: 1800,
    quantity_on_hand: 8,
    min_quantity: 2,
    sku: "INS-MAS-01",
  },
  {
    name: "Resina composta A2",
    unit_label: "un",
    unit_cost_cents: 9500,
    quantity_on_hand: 6,
    min_quantity: 2,
    sku: "INS-RES-A2",
  },
  {
    name: "Pasta profilática",
    unit_label: "un",
    unit_cost_cents: 4200,
    quantity_on_hand: 5,
    min_quantity: 1,
    sku: "INS-PAS-01",
  },
  {
    name: "Anestésico local",
    unit_label: "tubo",
    unit_cost_cents: 5500,
    quantity_on_hand: 20,
    min_quantity: 5,
    sku: "INS-ANE-01",
  },
  {
    name: "Fio dental profissional",
    unit_label: "rolo",
    unit_cost_cents: 1500,
    quantity_on_hand: 10,
    min_quantity: 2,
    sku: "INS-FIO-01",
  },
  {
    name: "Algodão rolado",
    unit_label: "pct",
    unit_cost_cents: 900,
    quantity_on_hand: 25,
    min_quantity: 5,
    sku: "INS-ALG-01",
  },
  {
    name: "Sugador descartável",
    unit_label: "pct",
    unit_cost_cents: 2200,
    quantity_on_hand: 15,
    min_quantity: 4,
    sku: "INS-SUG-01",
  },
  {
    name: "Gel clareador 35%",
    unit_label: "ser",
    unit_cost_cents: 12000,
    quantity_on_hand: 4,
    min_quantity: 1,
    sku: "INS-CLA-35",
  },
  {
    name: "Filme radiográfico",
    unit_label: "cx",
    unit_cost_cents: 7800,
    quantity_on_hand: 3,
    min_quantity: 1,
    sku: "INS-RAD-01",
  },
  {
    name: "Cimento ionômero",
    unit_label: "un",
    unit_cost_cents: 6500,
    quantity_on_hand: 7,
    min_quantity: 2,
    sku: "INS-CIM-01",
  },
  {
    name: "Broca diamantada",
    unit_label: "un",
    unit_cost_cents: 3500,
    quantity_on_hand: 18,
    min_quantity: 6,
    sku: "INS-BRO-01",
  },
];

const SUPPLIERS: Array<{
  name: string;
  phone: string;
  email: string;
  notes: string;
}> = [
  {
    name: "Dental Prime Distribuidora",
    phone: "(11) 3456-7890",
    email: "pedidos@dentalprime.demo",
    notes: "Beta: prazo 3 dias úteis.",
  },
  {
    name: "OdontoSupply Mercantil",
    phone: "(11) 3344-5566",
    email: "vendas@odontosupply.demo",
    notes: "Beta: frete grátis acima de R$500.",
  },
  {
    name: "BioLab Insumos",
    phone: "(11) 3999-1122",
    email: "contato@biolab.demo",
    notes: "Beta: foco em clareamento e resinas.",
  },
  {
    name: "OrthoTech Materiais",
    phone: "(11) 3777-8899",
    email: "comercial@orthotech.demo",
    notes: "Beta: materiais ortodônticos.",
  },
];

const INSURANCE_CARRIERS: Array<{
  name: string;
  ans_registry: string;
  plans: Array<{ name: string; requires_pre_auth: boolean }>;
}> = [
  {
    name: "OdontoPrev Demo",
    ans_registry: "41722-4",
    plans: [
      { name: "Essencial", requires_pre_auth: false },
      { name: "Premium", requires_pre_auth: true },
    ],
  },
  {
    name: "Amil Dental Demo",
    ans_registry: "32630-5",
    plans: [{ name: "Dental Clássico", requires_pre_auth: false }],
  },
  {
    name: "Bradesco Dental Demo",
    ans_registry: "00571-1",
    plans: [{ name: "Empresarial", requires_pre_auth: true }],
  },
];

function atLocalDay(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function buildBetaSeedBlueprint(): {
  patients: SeedPatient[];
  procedures: SeedProcedure[];
  supplies: SeedSupply[];
  suppliers: typeof SUPPLIERS;
  insuranceCarriers: typeof INSURANCE_CARRIERS;
  appointmentSlots: Array<{
    patientIndex: number;
    procedureIndex: number;
    dayOffset: number;
    hour: number;
    status: "confirmed" | "pending" | "completed";
  }>;
} {
  return {
    patients: PATIENTS,
    procedures: PROCEDURES,
    supplies: SUPPLIES,
    suppliers: SUPPLIERS,
    insuranceCarriers: INSURANCE_CARRIERS,
    appointmentSlots: [
      { patientIndex: 0, procedureIndex: 1, dayOffset: -3, hour: 9, status: "completed" },
      { patientIndex: 1, procedureIndex: 0, dayOffset: -2, hour: 10, status: "completed" },
      { patientIndex: 2, procedureIndex: 2, dayOffset: -1, hour: 14, status: "completed" },
      { patientIndex: 3, procedureIndex: 5, dayOffset: 0, hour: 8, status: "confirmed" },
      { patientIndex: 4, procedureIndex: 6, dayOffset: 0, hour: 11, status: "pending" },
      { patientIndex: 5, procedureIndex: 3, dayOffset: 1, hour: 9, status: "confirmed" },
      { patientIndex: 6, procedureIndex: 7, dayOffset: 1, hour: 15, status: "pending" },
      { patientIndex: 7, procedureIndex: 4, dayOffset: 2, hour: 10, status: "confirmed" },
      { patientIndex: 8, procedureIndex: 9, dayOffset: 2, hour: 16, status: "pending" },
      { patientIndex: 9, procedureIndex: 8, dayOffset: 3, hour: 9, status: "confirmed" },
      { patientIndex: 0, procedureIndex: 1, dayOffset: 4, hour: 14, status: "pending" },
      { patientIndex: 2, procedureIndex: 0, dayOffset: 5, hour: 11, status: "confirmed" },
    ],
  };
}

export type SeedClinicDemoResult =
  | {
      ok: true;
      seeded: true;
      counts: SeedClinicDemoCounts;
    }
  | { ok: true; seeded: false; reason: "already_complete" | "empty_ids" }
  | { ok: false; error: string };

async function countRows(
  admin: ReturnType<typeof createAdminClient>,
  table: string,
  clinicId: string,
): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Insere (ou completa) dados fictícios beta na clínica.
 * Idempotente por lacuna: só preenche tabelas ainda vazias / abaixo do alvo.
 */
export async function seedClinicDemo(
  clinicId: string,
  dentistId: string,
): Promise<SeedClinicDemoResult> {
  if (!clinicId || !dentistId) {
    return { ok: true, seeded: false, reason: "empty_ids" };
  }

  const admin = createAdminClient();
  const blueprint = buildBetaSeedBlueprint();

  let patientCount = 0;
  let procedureCount = 0;
  let supplyCount = 0;
  let appointmentCount = 0;
  let financeCount = 0;
  let supplierCount = 0;
  let carrierCount = 0;
  let didSeed = false;

  try {
    patientCount = await countRows(admin, "patients", clinicId);
    procedureCount = await countRows(admin, "procedures", clinicId);
    supplyCount = await countRows(admin, "supplies", clinicId);
    appointmentCount = await countRows(admin, "appointments", clinicId);
    financeCount = await countRows(admin, "financial_entries", clinicId);
    supplierCount = await countRows(admin, "suppliers", clinicId);
    carrierCount = await countRows(admin, "insurance_carriers", clinicId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (
    patientCount >= BETA_SEED_COUNTS.patients &&
    procedureCount >= BETA_SEED_COUNTS.procedures &&
    supplyCount >= BETA_SEED_COUNTS.supplies &&
    appointmentCount >= BETA_SEED_COUNTS.appointments &&
    financeCount >= BETA_SEED_COUNTS.financialEntries &&
    supplierCount >= BETA_SEED_COUNTS.suppliers &&
    carrierCount >= BETA_SEED_COUNTS.insuranceCarriers
  ) {
    return { ok: true, seeded: false, reason: "already_complete" };
  }

  let patientRows: Array<{ id: string; name: string }> = [];
  if (patientCount === 0) {
    const { data, error } = await admin
      .from("patients")
      .insert(
        blueprint.patients.map((p) => ({
          clinic_id: clinicId,
          name: p.name,
          phone: p.phone,
          whatsapp: p.whatsapp,
          birth_date: p.birth_date,
          notes: p.notes,
        })),
      )
      .select("id, name");
    if (error || !data?.length) {
      return { ok: false, error: error?.message ?? "Falha ao criar pacientes demo." };
    }
    patientRows = data;
    patientCount = data.length;
    didSeed = true;
  } else if (patientCount < BETA_SEED_COUNTS.patients) {
    const missing = blueprint.patients.slice(patientCount);
    const { data, error } = await admin
      .from("patients")
      .insert(
        missing.map((p) => ({
          clinic_id: clinicId,
          name: p.name,
          phone: p.phone,
          whatsapp: p.whatsapp,
          birth_date: p.birth_date,
          notes: p.notes,
        })),
      )
      .select("id, name");
    if (error) {
      return { ok: false, error: error.message };
    }
    patientCount += data?.length ?? 0;
    didSeed = true;
  }

  if (patientRows.length === 0) {
    const { data, error } = await admin
      .from("patients")
      .select("id, name")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: true });
    if (error) return { ok: false, error: error.message };
    patientRows = data ?? [];
  }

  let procedureRows: Array<{
    id: string;
    name: string;
    base_price_cents: number;
    default_duration_min: number;
  }> = [];

  {
    const { data, error } = await admin
      .from("procedures")
      .select("id, name, base_price_cents, default_duration_min")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: true });
    if (error) return { ok: false, error: error.message };
    procedureRows = data ?? [];
    const existingNames = new Set(procedureRows.map((p) => p.name));
    const missing = blueprint.procedures.filter((p) => !existingNames.has(p.name));
    if (missing.length > 0) {
      const { data: inserted, error: insertError } = await admin
        .from("procedures")
        .insert(
          missing.map((p) => ({
            clinic_id: clinicId,
            name: p.name,
            base_price_cents: p.base_price_cents,
            default_duration_min: p.default_duration_min,
            is_active: true,
          })),
        )
        .select("id, name, base_price_cents, default_duration_min");
      if (insertError) return { ok: false, error: insertError.message };
      procedureRows = [...procedureRows, ...(inserted ?? [])];
      procedureCount = procedureRows.length;
      didSeed = true;
    }
  }

  let supplyRows: Array<{ id: string; name: string }> = [];
  {
    const { data, error } = await admin
      .from("supplies")
      .select("id, name")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: true });
    if (error) return { ok: false, error: error.message };
    supplyRows = data ?? [];
    const existingNames = new Set(supplyRows.map((s) => s.name));
    const missing = blueprint.supplies.filter((s) => !existingNames.has(s.name));
    if (missing.length > 0) {
      const { data: inserted, error: insertError } = await admin
        .from("supplies")
        .insert(
          missing.map((s) => ({
            clinic_id: clinicId,
            name: s.name,
            unit_label: s.unit_label,
            unit_cost_cents: s.unit_cost_cents,
            quantity_on_hand: s.quantity_on_hand,
            min_quantity: s.min_quantity,
            sku: s.sku,
            is_active: true,
          })),
        )
        .select("id, name");
      if (insertError) return { ok: false, error: insertError.message };
      supplyRows = [...supplyRows, ...(inserted ?? [])];
      supplyCount = supplyRows.length;
      didSeed = true;

      if (existingNames.size === 0) {
        const limpeza = procedureRows.find((p) => p.name.includes("Limpeza"));
        const restauracao = procedureRows.find((p) => p.name.includes("Restauração"));
        const pasta = supplyRows.find((s) => s.name.includes("Pasta"));
        const resina = supplyRows.find((s) => s.name.includes("Resina"));
        const anestesico = supplyRows.find((s) => s.name.includes("Anestésico"));
        const bomRows: Array<{
          clinic_id: string;
          procedure_id: string;
          supply_id: string;
          quantity: number;
        }> = [];
        if (limpeza && pasta) {
          bomRows.push({
            clinic_id: clinicId,
            procedure_id: limpeza.id,
            supply_id: pasta.id,
            quantity: 1,
          });
        }
        if (restauracao && resina && anestesico) {
          bomRows.push(
            {
              clinic_id: clinicId,
              procedure_id: restauracao.id,
              supply_id: resina.id,
              quantity: 1,
            },
            {
              clinic_id: clinicId,
              procedure_id: restauracao.id,
              supply_id: anestesico.id,
              quantity: 1,
            },
          );
        }
        if (bomRows.length > 0) {
          const { error: bomError } = await admin
            .from("procedure_supply_items")
            .insert(bomRows);
          if (bomError) return { ok: false, error: bomError.message };
        }
      }
    }
  }

  let appointmentRows: Array<{
    id: string;
    procedure_id: string | null;
    status: string;
    starts_at: string;
  }> = [];

  if (
    appointmentCount < BETA_SEED_COUNTS.appointments &&
    patientRows.length >= 5 &&
    procedureRows.length >= 5
  ) {
    const slotsNeeded =
      BETA_SEED_COUNTS.appointments - appointmentCount;
    const slots = blueprint.appointmentSlots.slice(
      Math.max(0, blueprint.appointmentSlots.length - slotsNeeded),
    );
    const appointmentInserts = slots.map((slot) => {
      const procedureDef = blueprint.procedures[slot.procedureIndex];
      const procedure =
        (procedureDef &&
          procedureRows.find((row) => row.name === procedureDef.name)) ||
        procedureRows[slot.procedureIndex] ||
        procedureRows[0]!;
      const patient = patientRows[slot.patientIndex] ?? patientRows[0]!;
      const duration =
        procedure.default_duration_min ??
        procedureDef?.default_duration_min ??
        30;
      const starts = atLocalDay(slot.dayOffset, slot.hour);
      const ends = new Date(starts.getTime() + duration * 60_000);
      return {
        clinic_id: clinicId,
        dentist_id: dentistId,
        patient_id: patient.id,
        procedure_id: procedure.id,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        duration_min: duration,
        status: slot.status,
        procedure_label: procedure.name,
        notes: "Beta: consulta fictícia para testes.",
        payment_source: "particular" as const,
      };
    });

    const { data, error } = await admin
      .from("appointments")
      .insert(appointmentInserts)
      .select("id, procedure_id, status, starts_at");

    if (error || !data?.length) {
      return {
        ok: false,
        error: error?.message ?? "Falha ao criar consultas demo.",
      };
    }
    appointmentRows = data;
    appointmentCount += data.length;
    didSeed = true;
  }

  if (supplierCount < BETA_SEED_COUNTS.suppliers) {
    const { data: existingSuppliers } = await admin
      .from("suppliers")
      .select("name")
      .eq("clinic_id", clinicId);
    const existingNames = new Set((existingSuppliers ?? []).map((s) => s.name));
    const missing = blueprint.suppliers.filter((s) => !existingNames.has(s.name));
    if (missing.length > 0) {
      const { data: inserted, error } = await admin
        .from("suppliers")
        .insert(
          missing.map((s) => ({
            clinic_id: clinicId,
            name: s.name,
            phone: s.phone,
            email: s.email,
            notes: s.notes,
            is_active: true,
          })),
        )
        .select("id");
      if (error) return { ok: false, error: error.message };
      supplierCount += inserted?.length ?? 0;
      didSeed = true;

      if (supplyRows[0] && inserted?.[0]) {
        await admin
          .from("supplies")
          .update({ preferred_supplier_id: inserted[0].id })
          .eq("id", supplyRows[0].id)
          .eq("clinic_id", clinicId);
      }
    }
  }

  if (carrierCount < BETA_SEED_COUNTS.insuranceCarriers) {
    const { data: existingCarriers } = await admin
      .from("insurance_carriers")
      .select("name")
      .eq("clinic_id", clinicId);
    const existingNames = new Set((existingCarriers ?? []).map((c) => c.name));
    const missingCarriers = blueprint.insuranceCarriers.filter(
      (c) => !existingNames.has(c.name),
    );

    for (const carrier of missingCarriers) {
      const { data: carrierRow, error: carrierError } = await admin
        .from("insurance_carriers")
        .insert({
          clinic_id: clinicId,
          name: carrier.name,
          ans_registry: carrier.ans_registry,
          notes: "Beta: operadora fictícia.",
          is_active: true,
        })
        .select("id")
        .single();
      if (carrierError || !carrierRow) {
        return {
          ok: false,
          error: carrierError?.message ?? "Falha ao criar operadora demo.",
        };
      }

      const { data: planRows, error: planError } = await admin
        .from("insurance_plans")
        .insert(
          carrier.plans.map((plan) => ({
            clinic_id: clinicId,
            carrier_id: carrierRow.id,
            name: plan.name,
            requires_pre_auth: plan.requires_pre_auth,
            coverage_notes: "Beta: cobertura fictícia.",
            is_active: true,
          })),
        )
        .select("id");
      if (planError) return { ok: false, error: planError.message };

      const firstPlan = planRows?.[0];
      if (firstPlan && patientRows[0] && procedureRows[0]) {
        await admin.from("patient_insurance_enrollments").insert({
          clinic_id: clinicId,
          patient_id: patientRows[0].id,
          plan_id: firstPlan.id,
          card_number: "DEMO-0001",
          holder_name: patientRows[0].name,
          is_primary: true,
        });
        await admin.from("insurance_procedure_prices").insert({
          clinic_id: clinicId,
          plan_id: firstPlan.id,
          procedure_id: procedureRows[0].id,
          price_cents: Math.round(procedureRows[0].base_price_cents * 0.8),
          tuss_code: "81000030",
        });
      }
      carrierCount += 1;
      didSeed = true;
    }
  }

  if (financeCount < BETA_SEED_COUNTS.financialEntries) {
    const yearMonth = new Date().toISOString().slice(0, 7);
    await admin.from("clinic_monthly_settings").upsert({
      clinic_id: clinicId,
      year_month: yearMonth,
      fixed_costs_cents: 420000,
    });

    const today = new Date().toISOString().slice(0, 10);
    const financeRows = [
      {
        clinic_id: clinicId,
        entry_type: "manual_expense" as const,
        source: "manual" as const,
        amount_cents: -45000,
        description: "Beta: reposição de insumos",
        entry_date: today,
        dentist_id: dentistId,
      },
      {
        clinic_id: clinicId,
        entry_type: "manual_expense" as const,
        source: "manual" as const,
        amount_cents: -89000,
        description: "Beta: energia e água do consultório",
        entry_date: today,
        dentist_id: dentistId,
      },
      {
        clinic_id: clinicId,
        entry_type: "manual_revenue" as const,
        source: "manual" as const,
        amount_cents: 22000,
        description: "Beta: limpeza particular",
        entry_date: today,
        dentist_id: dentistId,
      },
      {
        clinic_id: clinicId,
        entry_type: "manual_revenue" as const,
        source: "manual" as const,
        amount_cents: 28000,
        description: "Beta: restauração particular",
        entry_date: today,
        dentist_id: dentistId,
      },
      {
        clinic_id: clinicId,
        entry_type: "manual_revenue" as const,
        source: "manual" as const,
        amount_cents: 45000,
        description: "Beta: clareamento (sessão)",
        entry_date: today,
        dentist_id: dentistId,
      },
      {
        clinic_id: clinicId,
        entry_type: "manual_expense" as const,
        source: "manual" as const,
        amount_cents: -12000,
        description: "Beta: material de consumo avulso",
        entry_date: today,
        dentist_id: dentistId,
      },
      {
        clinic_id: clinicId,
        entry_type: "manual_revenue" as const,
        source: "manual" as const,
        amount_cents: 15000,
        description: "Beta: avaliação de retorno",
        entry_date: today,
        dentist_id: dentistId,
      },
      {
        clinic_id: clinicId,
        entry_type: "manual_expense" as const,
        source: "manual" as const,
        amount_cents: -35000,
        description: "Beta: pedido Dental Prime",
        entry_date: today,
        dentist_id: dentistId,
      },
    ].slice(0, BETA_SEED_COUNTS.financialEntries - financeCount);

    if (financeRows.length > 0) {
      const { error: financeError } = await admin
        .from("financial_entries")
        .insert(financeRows);
      if (financeError) {
        return { ok: false, error: financeError.message };
      }
      financeCount += financeRows.length;
      didSeed = true;
    }
  }

  if (!didSeed) {
    return { ok: true, seeded: false, reason: "already_complete" };
  }

  return {
    ok: true,
    seeded: true,
    counts: {
      patients: patientCount,
      procedures: procedureCount,
      supplies: supplyCount,
      appointments: appointmentCount,
      financialEntries: financeCount,
      suppliers: supplierCount,
      insuranceCarriers: carrierCount,
    },
  };
}

export type SeedAllClinicsResult = {
  considered: number;
  seeded: number;
  skipped: number;
  failures: Array<{ clinicId: string; error: string }>;
};

/** Seed / completa dados demo em todas as clínicas cadastradas. */
export async function seedAllClinicsMissingDemo(): Promise<SeedAllClinicsResult> {
  const admin = createAdminClient();
  const { data: clinics, error } = await admin.from("clinics").select("id, name");
  if (error) {
    throw new Error(error.message);
  }

  const result: SeedAllClinicsResult = {
    considered: clinics?.length ?? 0,
    seeded: 0,
    skipped: 0,
    failures: [],
  };

  for (const clinic of clinics ?? []) {
    const { data: dentist } = await admin
      .from("dentists")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!dentist?.id) {
      result.skipped += 1;
      continue;
    }

    const seed = await seedClinicDemo(clinic.id, dentist.id);
    if (!seed.ok) {
      result.failures.push({ clinicId: clinic.id, error: seed.error });
      continue;
    }
    if (seed.seeded) {
      result.seeded += 1;
    } else {
      result.skipped += 1;
    }
  }

  return result;
}

export type ResolveOverlapsResult = {
  clinicId: string;
  cancelledIds: string[];
};

/** Cancels later overlapping appointments for one clinic (keeps earliest). */
export async function resolveOverlappingAppointmentsForClinic(
  clinicId: string,
): Promise<ResolveOverlapsResult> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("appointments")
    .select("id, dentist_id, starts_at, ends_at, status")
    .eq("clinic_id", clinicId)
    .neq("status", "cancelled");

  if (error) throw new Error(error.message);

  const cancelledIds = pickOverlappingIdsToCancel(rows ?? []);
  if (cancelledIds.length === 0) {
    return { clinicId, cancelledIds: [] };
  }

  const { error: updateError } = await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("clinic_id", clinicId)
    .in("id", cancelledIds);

  if (updateError) throw new Error(updateError.message);

  return { clinicId, cancelledIds };
}

/** Resolve overlaps for all clinics. */
export async function resolveOverlappingAppointmentsForAllClinics(): Promise<
  ResolveOverlapsResult[]
> {
  const admin = createAdminClient();
  const { data: clinics, error } = await admin.from("clinics").select("id");
  if (error) throw new Error(error.message);

  const results: ResolveOverlapsResult[] = [];
  for (const clinic of clinics ?? []) {
    results.push(await resolveOverlappingAppointmentsForClinic(clinic.id));
  }
  return results;
}
