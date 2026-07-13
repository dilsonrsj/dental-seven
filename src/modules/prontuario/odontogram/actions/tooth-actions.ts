"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, requireAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { assertNotImpersonating } from "@/modules/admin/impersonation";
import { createClient } from "@/lib/supabase/server";
import type { PatientToothRecordListItem } from "../../types";
import { isValidFdiTooth } from "../data/fdi";
import {
  assertValidToothRecordInput,
  normalizeToothNote,
} from "../data/tooth-record-input";

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

function mapRow(row: {
  id: string;
  clinic_id: string;
  patient_id: string;
  tooth_number: number;
  status: string;
  faces: string[];
  note: string | null;
  updated_by: string | null;
  updated_at: string;
}): PatientToothRecordListItem {
  return {
    id: row.id,
    clinic_id: row.clinic_id,
    patient_id: row.patient_id,
    tooth_number: row.tooth_number,
    status: row.status,
    faces: row.faces ?? [],
    note: row.note,
    updated_by: row.updated_by,
    updated_at: row.updated_at,
  };
}

export async function listPatientToothRecords(
  patientId: string,
): Promise<PatientToothRecordListItem[]> {
  if (isDemoMockDataEnabled()) return [];

  await assertProntuarioModule();
  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_tooth_records")
    .select(
      "id, clinic_id, patient_id, tooth_number, status, faces, note, updated_by, updated_at",
    )
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .order("tooth_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function upsertPatientToothRecord(
  patientId: string,
  toothNumber: number,
  input: { status: string; note?: string | null },
): Promise<PatientToothRecordListItem> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Odontograma indisponível no modo demo.");
  }

  const ctx = await assertProntuarioModule();
  await assertWritable();

  const note = normalizeToothNote(input.note);
  assertValidToothRecordInput({ toothNumber, status: input.status, note });

  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_tooth_records")
    .upsert(
      {
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: toothNumber,
        status: input.status,
        faces: [],
        note,
        updated_by: ctx.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "patient_id,tooth_number" },
    )
    .select(
      "id, clinic_id, patient_id, tooth_number, status, faces, note, updated_by, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/pacientes/${patientId}/prontuario`);
  return mapRow(data);
}

export async function clearPatientToothRecord(
  patientId: string,
  toothNumber: number,
): Promise<void> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Odontograma indisponível no modo demo.");
  }

  await assertProntuarioModule();
  await assertWritable();

  if (!isValidFdiTooth(toothNumber)) {
    throw new Error("Número de dente FDI inválido.");
  }

  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("patient_tooth_records")
    .delete()
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .eq("tooth_number", toothNumber);

  if (error) throw new Error(error.message);
  revalidatePath(`/pacientes/${patientId}/prontuario`);
}
