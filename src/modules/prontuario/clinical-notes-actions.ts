"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext, requireAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { assertNotImpersonating } from "@/modules/admin/impersonation";
import { createClient } from "@/lib/supabase/server";
import type { PatientClinicalNoteListItem } from "./types";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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

type ClinicalNoteRow = {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id: string | null;
  author_id: string | null;
  body: string;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
  appointments:
    | { starts_at: string; procedure_label: string }
    | { starts_at: string; procedure_label: string }[]
    | null;
};

function formatAppointmentLabel(
  appointment: { starts_at: string; procedure_label: string } | null,
): string | null {
  if (!appointment) return null;
  const date = new Date(appointment.starts_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} — ${appointment.procedure_label}`;
}

function mapClinicalNoteRow(row: ClinicalNoteRow): PatientClinicalNoteListItem {
  const author = firstRelation(row.profiles);
  const appointment = firstRelation(row.appointments);

  return {
    id: row.id,
    clinic_id: row.clinic_id,
    patient_id: row.patient_id,
    appointment_id: row.appointment_id,
    author_id: row.author_id,
    body: row.body,
    created_at: row.created_at,
    author_name: author?.full_name ?? null,
    appointment_label: formatAppointmentLabel(appointment),
  };
}

export async function listPatientClinicalNotes(
  patientId: string,
): Promise<PatientClinicalNoteListItem[]> {
  if (isDemoMockDataEnabled()) {
    return [];
  }

  await assertProntuarioModule();
  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patient_clinical_notes")
    .select(
      `
        id,
        clinic_id,
        patient_id,
        appointment_id,
        author_id,
        body,
        created_at,
        profiles ( full_name ),
        appointments ( starts_at, procedure_label )
      `,
    )
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapClinicalNoteRow(row as ClinicalNoteRow));
}

export async function createPatientClinicalNote(
  patientId: string,
  body: string,
  appointmentId?: string | null,
): Promise<PatientClinicalNoteListItem> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Evolução clínica indisponível no modo demo.");
  }

  const ctx = await assertProntuarioModule();
  await assertWritable();

  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error("Descreva a evolução clínica antes de salvar.");
  }

  const clinicId = await requireClinicId();
  await requirePatientInClinic(patientId, clinicId);

  const supabase = await createClient();

  if (appointmentId) {
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", appointmentId)
      .eq("clinic_id", clinicId)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (appointmentError) throw new Error(appointmentError.message);
    if (!appointment) throw new Error("Consulta não encontrada para este paciente.");
  }

  const { data, error } = await supabase
    .from("patient_clinical_notes")
    .insert({
      clinic_id: clinicId,
      patient_id: patientId,
      appointment_id: appointmentId || null,
      author_id: ctx.userId,
      body: trimmedBody,
    })
    .select(
      `
        id,
        clinic_id,
        patient_id,
        appointment_id,
        author_id,
        body,
        created_at,
        profiles ( full_name ),
        appointments ( starts_at, procedure_label )
      `,
    )
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/pacientes/${patientId}/prontuario`);
  return mapClinicalNoteRow(data as ClinicalNoteRow);
}
