"use server";

import { revalidatePath } from "next/cache";
import {
  getAuthContext,
  requireAuthContext,
  requireClinicId,
} from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { assertNotImpersonating } from "@/modules/admin/impersonation";
import { createClient } from "@/lib/supabase/server";
import { computeAnamnesisAlerts } from "./alerts";
import {
  ANAMNESIS_TEMPLATE_VERSION,
  normalizeAnamnesisResponses,
} from "./template-v1";
import type { PatientAnamnesis } from "./types";

async function assertProntuarioModule() {
  const ctx = await requireAuthContext();
  if (!ctx.enabledModules.includes("prontuario")) {
    throw new Error("Módulo Prontuário não disponível no seu plano.");
  }
  return ctx;
}

async function assertWritable() {
  const ctx = await getAuthContext();
  assertNotImpersonating(ctx?.isImpersonating);
  if (
    !ctx?.clinic ||
    isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)
  ) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

async function requirePatientInClinic(patientId: string, clinicId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("id", patientId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Paciente não encontrado.");
}

type AnamnesisRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  template_version: string;
  responses: unknown;
  has_critical_alert: boolean;
  filled_by: string | null;
  created_at: string;
  updated_at: string;
};

function mapAnamnesisRow(row: AnamnesisRow): PatientAnamnesis {
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    patient_id: row.patient_id,
    template_version: row.template_version,
    responses: normalizeAnamnesisResponses(row.responses),
    has_critical_alert: row.has_critical_alert,
    filled_by: row.filled_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getPatientAnamnesis(
  patientId: string,
): Promise<PatientAnamnesis | null> {
  if (isDemoMockDataEnabled()) {
    return null;
  }

  await assertProntuarioModule();
  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_anamnesis")
    .select(
      "id, clinic_id, patient_id, template_version, responses, has_critical_alert, filled_by, created_at, updated_at",
    )
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapAnamnesisRow(data as AnamnesisRow);
}

export async function upsertPatientAnamnesis(
  patientId: string,
  rawResponses: unknown,
): Promise<PatientAnamnesis> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Anamnese indisponível no modo demo.");
  }

  const ctx = await assertProntuarioModule();
  await assertWritable();

  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const responses = normalizeAnamnesisResponses(rawResponses);
  const { has_critical_alert } = computeAnamnesisAlerts(responses);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_anamnesis")
    .upsert(
      {
        clinic_id: clinicId,
        patient_id: patientId,
        template_version: ANAMNESIS_TEMPLATE_VERSION,
        responses,
        has_critical_alert,
        filled_by: ctx.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "patient_id" },
    )
    .select(
      "id, clinic_id, patient_id, template_version, responses, has_critical_alert, filled_by, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/pacientes/${patientId}/anamnese`);
  return mapAnamnesisRow(data as AnamnesisRow);
}
