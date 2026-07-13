"use server";

import { revalidatePath } from "next/cache";
import {
  assertClinicContext,
  getAuthContext,
} from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";
import { canTransitionClaimStatus, isGlosaStatus } from "./claim-status";
import {
  assertCardNumber,
  assertCarrierName,
  assertClaimAmount,
  assertPlanName,
  normalizeOptionalText,
} from "./validation";
import type {
  CarrierFormInput,
  EnrollmentFormInput,
  InsuranceCarrierWithPlans,
  InsuranceClaimRow,
  InsuranceClaimStatus,
  InsurancePlanOption,
  InsuranceProcedurePriceRow,
  PatientEnrollmentRow,
  PlanFormInput,
} from "./types";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function requireConveniosModule() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Sessão inválida.");
  if (!ctx.enabledModules.includes("convenios")) {
    throw new Error("Módulo Convênios não está ativo para esta clínica.");
  }
  return assertClinicContext(ctx);
}

async function assertWritableAdmin() {
  const ctx = await requireConveniosModule();
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Apenas o administrador pode gerenciar convênios.");
  }
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
  return ctx;
}

async function assertWritableClinic() {
  const ctx = await requireConveniosModule();
  if (isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
  return ctx;
}

async function requirePlanInClinic(planId: string, clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insurance_plans")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("id", planId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Plano não encontrado.");
}

// ---------------------------------------------------------------------------
// Carriers + plans
// ---------------------------------------------------------------------------

export async function listCarriersWithPlans(): Promise<
  InsuranceCarrierWithPlans[]
> {
  if (isDemoMockDataEnabled()) return [];
  const ctx = await requireConveniosModule();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("insurance_carriers")
    .select(
      `id, clinic_id, name, ans_registry, provider_code, portal_url, notes, is_active, created_at, updated_at,
       insurance_plans ( id, clinic_id, carrier_id, name, requires_pre_auth, coverage_notes, is_active, created_at, updated_at )`,
    )
    .eq("clinic_id", ctx.clinic.id)
    .order("name");

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const { insurance_plans, ...carrier } = row as typeof row & {
      insurance_plans: InsuranceCarrierWithPlans["plans"];
    };
    const plans = (insurance_plans ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    return { ...(carrier as InsuranceCarrierWithPlans), plans };
  });
}

export async function createCarrier(input: CarrierFormInput) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("insurance_carriers").insert({
    clinic_id: ctx.clinic.id,
    name: assertCarrierName(input.name),
    ans_registry: normalizeOptionalText(input.ans_registry),
    provider_code: normalizeOptionalText(input.provider_code),
    portal_url: normalizeOptionalText(input.portal_url),
    notes: normalizeOptionalText(input.notes) ?? "",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

export async function updateCarrier(id: string, input: CarrierFormInput) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("insurance_carriers")
    .update({
      name: assertCarrierName(input.name),
      ans_registry: normalizeOptionalText(input.ans_registry),
      provider_code: normalizeOptionalText(input.provider_code),
      portal_url: normalizeOptionalText(input.portal_url),
      notes: normalizeOptionalText(input.notes) ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", ctx.clinic.id);

  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

export async function setCarrierActive(id: string, isActive: boolean) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("insurance_carriers")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("clinic_id", ctx.clinic.id);

  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

export async function createPlan(input: PlanFormInput) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();

  const { data: carrier, error: carrierError } = await supabase
    .from("insurance_carriers")
    .select("id")
    .eq("id", input.carrier_id)
    .eq("clinic_id", ctx.clinic.id)
    .maybeSingle();
  if (carrierError) throw new Error(carrierError.message);
  if (!carrier) throw new Error("Operadora não encontrada.");

  const { error } = await supabase.from("insurance_plans").insert({
    clinic_id: ctx.clinic.id,
    carrier_id: input.carrier_id,
    name: assertPlanName(input.name),
    requires_pre_auth: input.requires_pre_auth,
    coverage_notes: normalizeOptionalText(input.coverage_notes) ?? "",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

export async function updatePlan(
  id: string,
  input: Omit<PlanFormInput, "carrier_id">,
) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("insurance_plans")
    .update({
      name: assertPlanName(input.name),
      requires_pre_auth: input.requires_pre_auth,
      coverage_notes: normalizeOptionalText(input.coverage_notes) ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", ctx.clinic.id);

  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

export async function setPlanActive(id: string, isActive: boolean) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("insurance_plans")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("clinic_id", ctx.clinic.id);

  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

export async function listActivePlanOptions(): Promise<InsurancePlanOption[]> {
  if (isDemoMockDataEnabled()) return [];
  const ctx = await requireConveniosModule();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("insurance_plans")
    .select(
      "id, name, requires_pre_auth, is_active, insurance_carriers ( name, is_active )",
    )
    .eq("clinic_id", ctx.clinic.id)
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(error.message);

  const options: InsurancePlanOption[] = [];
  for (const row of data ?? []) {
    const carrier = firstRelation(
      row.insurance_carriers as
        | { name: string; is_active: boolean }
        | { name: string; is_active: boolean }[]
        | null,
    );
    if (!carrier?.is_active) continue;
    options.push({
      plan_id: row.id as string,
      plan_name: row.name as string,
      carrier_name: carrier.name,
      requires_pre_auth: row.requires_pre_auth as boolean,
    });
  }
  return options;
}

/** Primary enrollment plan_id per patient — for agenda pre-selection. */
export async function listPrimaryEnrollmentPlanByPatient(): Promise<
  Record<string, string>
> {
  if (isDemoMockDataEnabled()) return {};
  const ctx = await getAuthContext();
  if (!ctx?.clinic || !ctx.enabledModules.includes("convenios")) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_insurance_enrollments")
    .select(
      `patient_id, plan_id,
       insurance_plans ( is_active, insurance_carriers ( is_active ) )`,
    )
    .eq("clinic_id", ctx.clinic.id)
    .eq("is_primary", true);

  if (error) throw new Error(error.message);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const plan = firstRelation(
      row.insurance_plans as
        | { is_active: boolean; insurance_carriers: unknown }
        | { is_active: boolean; insurance_carriers: unknown }[]
        | null,
    );
    const carrier = firstRelation(
      (plan?.insurance_carriers ?? null) as
        | { is_active: boolean }
        | { is_active: boolean }[]
        | null,
    );
    if (plan?.is_active && carrier?.is_active) {
      map[row.patient_id as string] = row.plan_id as string;
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Procedure prices
// ---------------------------------------------------------------------------

export async function listProcedurePrices(
  planId: string,
): Promise<InsuranceProcedurePriceRow[]> {
  if (isDemoMockDataEnabled()) return [];
  const ctx = await requireConveniosModule();
  await requirePlanInClinic(planId, ctx.clinic.id);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("insurance_procedure_prices")
    .select(
      "id, plan_id, procedure_id, price_cents, tuss_code, procedures ( name )",
    )
    .eq("clinic_id", ctx.clinic.id)
    .eq("plan_id", planId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const procedure = firstRelation(
      row.procedures as { name: string } | { name: string }[] | null,
    );
    return {
      id: row.id as string,
      plan_id: row.plan_id as string,
      procedure_id: row.procedure_id as string,
      price_cents: row.price_cents as number,
      tuss_code: (row.tuss_code as string | null) ?? null,
      procedure_name: procedure?.name ?? "Procedimento",
    };
  });
}

export async function upsertProcedurePrice(input: {
  plan_id: string;
  procedure_id: string;
  price_cents: number;
  tuss_code?: string | null;
}) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  await requirePlanInClinic(input.plan_id, ctx.clinic.id);
  const supabase = await createClient();

  const { data: procedure, error: procError } = await supabase
    .from("procedures")
    .select("id")
    .eq("id", input.procedure_id)
    .eq("clinic_id", ctx.clinic.id)
    .maybeSingle();
  if (procError) throw new Error(procError.message);
  if (!procedure) throw new Error("Procedimento não encontrado.");

  const { error } = await supabase.from("insurance_procedure_prices").upsert(
    {
      clinic_id: ctx.clinic.id,
      plan_id: input.plan_id,
      procedure_id: input.procedure_id,
      price_cents: assertClaimAmount(input.price_cents),
      tuss_code: normalizeOptionalText(input.tuss_code),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "plan_id,procedure_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

export async function deleteProcedurePrice(id: string) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("insurance_procedure_prices")
    .delete()
    .eq("id", id)
    .eq("clinic_id", ctx.clinic.id);
  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

// ---------------------------------------------------------------------------
// Patient enrollments
// ---------------------------------------------------------------------------

export async function listPatientEnrollments(
  patientId: string,
): Promise<PatientEnrollmentRow[]> {
  if (isDemoMockDataEnabled()) return [];
  const ctx = await requireConveniosModule();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patient_insurance_enrollments")
    .select(
      `id, clinic_id, patient_id, plan_id, card_number, holder_name, valid_until, is_primary,
       insurance_plans ( name, insurance_carriers ( name ) )`,
    )
    .eq("clinic_id", ctx.clinic.id)
    .eq("patient_id", patientId)
    .order("is_primary", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const plan = firstRelation(
      row.insurance_plans as
        | { name: string; insurance_carriers: unknown }
        | { name: string; insurance_carriers: unknown }[]
        | null,
    );
    const carrier = firstRelation(
      (plan?.insurance_carriers ?? null) as
        | { name: string }
        | { name: string }[]
        | null,
    );
    return {
      id: row.id as string,
      clinic_id: row.clinic_id as string,
      patient_id: row.patient_id as string,
      plan_id: row.plan_id as string,
      card_number: row.card_number as string,
      holder_name: (row.holder_name as string | null) ?? null,
      valid_until: (row.valid_until as string | null) ?? null,
      is_primary: row.is_primary as boolean,
      plan_name: plan?.name ?? "Plano",
      carrier_name: carrier?.name ?? "Operadora",
    };
  });
}

export async function savePatientEnrollment(input: EnrollmentFormInput) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableClinic();
  await requirePlanInClinic(input.plan_id, ctx.clinic.id);
  const supabase = await createClient();

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("id", input.patient_id)
    .eq("clinic_id", ctx.clinic.id)
    .maybeSingle();
  if (patientError) throw new Error(patientError.message);
  if (!patient) throw new Error("Paciente não encontrado.");

  const { error } = await supabase.from("patient_insurance_enrollments").insert({
    clinic_id: ctx.clinic.id,
    patient_id: input.patient_id,
    plan_id: input.plan_id,
    card_number: assertCardNumber(input.card_number),
    holder_name: normalizeOptionalText(input.holder_name),
    valid_until: input.valid_until || null,
    is_primary: input.is_primary,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/pacientes/${input.patient_id}`);
}

export async function deletePatientEnrollment(
  id: string,
  patientId: string,
) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableClinic();
  const supabase = await createClient();
  const { error } = await supabase
    .from("patient_insurance_enrollments")
    .delete()
    .eq("id", id)
    .eq("clinic_id", ctx.clinic.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/pacientes/${patientId}`);
}

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

const CLAIM_SELECT = `id, clinic_id, patient_id, plan_id, appointment_id, procedure_id, status, auth_password,
  submitted_amount_cents, paid_amount_cents, glosa_reason, glosa_amount_cents, submitted_at, paid_at, notes,
  created_at, updated_at,
  patients ( name ),
  insurance_plans ( name, insurance_carriers ( name ) )`;

function mapClaimRow(row: Record<string, unknown>): InsuranceClaimRow {
  const patient = firstRelation(
    row.patients as { name: string } | { name: string }[] | null,
  );
  const plan = firstRelation(
    row.insurance_plans as
      | { name: string; insurance_carriers: unknown }
      | { name: string; insurance_carriers: unknown }[]
      | null,
  );
  const carrier = firstRelation(
    (plan?.insurance_carriers ?? null) as
      | { name: string }
      | { name: string }[]
      | null,
  );
  return {
    id: row.id as string,
    clinic_id: row.clinic_id as string,
    patient_id: row.patient_id as string,
    plan_id: row.plan_id as string,
    appointment_id: (row.appointment_id as string | null) ?? null,
    procedure_id: (row.procedure_id as string | null) ?? null,
    status: row.status as InsuranceClaimStatus,
    auth_password: (row.auth_password as string | null) ?? null,
    submitted_amount_cents: row.submitted_amount_cents as number,
    paid_amount_cents: (row.paid_amount_cents as number | null) ?? null,
    glosa_reason: (row.glosa_reason as string) ?? "",
    glosa_amount_cents: (row.glosa_amount_cents as number | null) ?? null,
    submitted_at: (row.submitted_at as string | null) ?? null,
    paid_at: (row.paid_at as string | null) ?? null,
    notes: (row.notes as string) ?? "",
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    patient_name: patient?.name ?? "Paciente",
    plan_name: plan?.name ?? "Plano",
    carrier_name: carrier?.name ?? "Operadora",
  };
}

export async function listClaims(): Promise<InsuranceClaimRow[]> {
  if (isDemoMockDataEnabled()) return [];
  const ctx = await requireConveniosModule();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("insurance_claims")
    .select(CLAIM_SELECT)
    .eq("clinic_id", ctx.clinic.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapClaimRow(row as Record<string, unknown>));
}

export async function updateClaimStatus(input: {
  id: string;
  status: InsuranceClaimStatus;
  auth_password?: string | null;
  glosa_reason?: string | null;
  glosa_amount_cents?: number | null;
  notes?: string | null;
}) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("insurance_claims")
    .select("status")
    .eq("id", input.id)
    .eq("clinic_id", ctx.clinic.id)
    .maybeSingle();
  if (currentError) throw new Error(currentError.message);
  if (!current) throw new Error("Guia não encontrada.");

  const from = current.status as InsuranceClaimStatus;
  if (!canTransitionClaimStatus(from, input.status)) {
    throw new Error(
      `Transição de status inválida (${from} → ${input.status}).`,
    );
  }

  const patch: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  if (input.auth_password !== undefined) {
    patch.auth_password = normalizeOptionalText(input.auth_password);
  }
  if (input.notes !== undefined) {
    patch.notes = normalizeOptionalText(input.notes) ?? "";
  }
  if (isGlosaStatus(input.status)) {
    patch.glosa_reason = normalizeOptionalText(input.glosa_reason) ?? "";
    patch.glosa_amount_cents =
      input.glosa_amount_cents != null
        ? assertClaimAmount(input.glosa_amount_cents)
        : null;
  }
  if (input.status === "submitted") {
    patch.submitted_at = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase
    .from("insurance_claims")
    .update(patch)
    .eq("id", input.id)
    .eq("clinic_id", ctx.clinic.id);

  if (error) throw new Error(error.message);
  revalidatePath("/convenios");
}

/**
 * Marks a claim as paid (or partially paid after glosa) and — when the
 * financeiro module is active — records the received amount as a normal
 * `revenue` entry so it flows into the clinic ledger on a cash basis.
 */
export async function markClaimPaid(input: {
  id: string;
  paid_amount_cents: number;
  partial?: boolean;
}) {
  if (isDemoMockDataEnabled()) {
    throw new Error("Convênios indisponível no modo demo.");
  }
  const ctx = await assertWritableAdmin();
  const supabase = await createClient();
  const paidCents = assertClaimAmount(input.paid_amount_cents);

  const { data: claim, error: claimError } = await supabase
    .from("insurance_claims")
    .select(
      "id, status, procedure_id, appointment_id, plan_id, insurance_plans ( name )",
    )
    .eq("id", input.id)
    .eq("clinic_id", ctx.clinic.id)
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claim) throw new Error("Guia não encontrada.");

  const targetStatus: InsuranceClaimStatus = input.partial
    ? "partial_glosa"
    : "paid";
  const from = claim.status as InsuranceClaimStatus;
  if (!canTransitionClaimStatus(from, targetStatus)) {
    throw new Error(`Não é possível marcar como pago a partir de ${from}.`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error: updateError } = await supabase
    .from("insurance_claims")
    .update({
      status: targetStatus,
      paid_amount_cents: paidCents,
      paid_at: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("clinic_id", ctx.clinic.id);
  if (updateError) throw new Error(updateError.message);

  if (paidCents > 0 && ctx.enabledModules.includes("financeiro")) {
    const plan = firstRelation(
      claim.insurance_plans as { name: string } | { name: string }[] | null,
    );
    const { error: entryError } = await supabase
      .from("financial_entries")
      .insert({
        clinic_id: ctx.clinic.id,
        entry_type: "revenue",
        source: "auto",
        amount_cents: paidCents,
        appointment_id: claim.appointment_id ?? null,
        procedure_id: claim.procedure_id ?? null,
        description: `Convênio ${plan?.name ?? ""} — guia recebida`.trim(),
        entry_date: today,
        created_by: ctx.userId,
      });
    if (entryError) throw new Error(entryError.message);
  }

  revalidatePath("/convenios");
  revalidatePath("/financeiro");
}

export async function getOpenReceivableCents(): Promise<number> {
  if (isDemoMockDataEnabled()) return 0;
  const ctx = await getAuthContext();
  if (!ctx?.clinic || !ctx.enabledModules.includes("convenios")) return 0;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insurance_claims")
    .select("submitted_amount_cents, status")
    .eq("clinic_id", ctx.clinic.id)
    .in("status", [
      "draft",
      "awaiting_auth",
      "authorized",
      "submitted",
      "partial_glosa",
      "appealing",
    ]);

  if (error) throw new Error(error.message);
  return (data ?? []).reduce(
    (sum, row) => sum + (row.submitted_amount_cents as number),
    0,
  );
}

/**
 * Server helper (not a form action target) invoked when an insurance-based
 * appointment is completed. Creates a draft claim if one does not yet exist.
 */
export async function createClaimForAppointment(
  appointmentId: string,
): Promise<void> {
  if (isDemoMockDataEnabled()) return;
  const ctx = await getAuthContext();
  if (!ctx?.clinic || !ctx.enabledModules.includes("convenios")) return;

  const supabase = await createClient();
  const { data: appointment, error: apptError } = await supabase
    .from("appointments")
    .select("id, patient_id, procedure_id, payment_source, insurance_plan_id")
    .eq("id", appointmentId)
    .eq("clinic_id", ctx.clinic.id)
    .maybeSingle();
  if (apptError) throw new Error(apptError.message);
  if (
    !appointment ||
    appointment.payment_source !== "insurance" ||
    !appointment.insurance_plan_id
  ) {
    return;
  }

  const { data: existing } = await supabase
    .from("insurance_claims")
    .select("id")
    .eq("clinic_id", ctx.clinic.id)
    .eq("appointment_id", appointmentId)
    .maybeSingle();
  if (existing) return;

  let submittedAmount = 0;
  if (appointment.procedure_id) {
    const { data: price } = await supabase
      .from("insurance_procedure_prices")
      .select("price_cents")
      .eq("clinic_id", ctx.clinic.id)
      .eq("plan_id", appointment.insurance_plan_id)
      .eq("procedure_id", appointment.procedure_id)
      .maybeSingle();
    submittedAmount = (price?.price_cents as number | undefined) ?? 0;
  }

  const { error: insertError } = await supabase.from("insurance_claims").insert({
    clinic_id: ctx.clinic.id,
    patient_id: appointment.patient_id,
    plan_id: appointment.insurance_plan_id,
    appointment_id: appointmentId,
    procedure_id: appointment.procedure_id ?? null,
    status: "draft",
    submitted_amount_cents: submittedAmount,
  });
  if (insertError) throw new Error(insertError.message);
}
