"use server";

import { revalidatePath } from "next/cache";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { demoStore } from "@/lib/demo/store";
import { getAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { createClient } from "@/lib/supabase/server";
import type { PatientAppointmentWithRelations } from "./types";

async function assertWritable() {
  const ctx = await getAuthContext();
  if (
    !ctx?.clinic ||
    isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)
  ) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

export async function isSupabaseConfigured() {
  if (isDemoMockDataEnabled()) return true;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getPatients(search?: string, limit?: number) {
  if (isDemoMockDataEnabled()) {
    const rows = demoStore.getPatients(search);
    return typeof limit === "number" ? rows.slice(0, limit) : rows;
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  const term = search?.trim();
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(
      `name.ilike.${pattern},phone.ilike.${pattern},whatsapp.ilike.${pattern}`,
    );
  }

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data ?? [];
}

/** Typeahead leve para o dropdown de pacientes. */
export async function searchPatientsLite(search: string, limit = 8) {
  return getPatients(search, limit);
}

export async function getPatient(id: string) {
  if (isDemoMockDataEnabled()) {
    return demoStore.getPatient(id);
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export type CreatePatientInput = {
  name: string;
  phone?: string;
  whatsapp?: string;
  birth_date?: string;
  notes?: string;
};

export async function createPatient(input: CreatePatientInput) {
  if (!(await isSupabaseConfigured())) {
    throw new Error("Configure .env.local");
  }
  await assertWritable();

  const name = input.name.trim();
  if (name.length < 2) {
    throw new Error("Nome deve ter pelo menos 2 caracteres.");
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: clinicId,
      name,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      birth_date: input.birth_date || null,
      notes: input.notes?.trim() || "",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/pacientes");

  return data;
}

export async function updatePatientNotes(id: string, notes: string) {
  if (isDemoMockDataEnabled()) {
    const data = demoStore.updatePatientNotes(id, notes);
    revalidatePath(`/pacientes/${id}`);
    revalidatePath("/pacientes");
    return data;
  }
  await assertWritable();

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .update({ notes })
    .eq("clinic_id", clinicId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/pacientes/${id}`);
  revalidatePath("/pacientes");

  return data;
}

export async function getPatientAppointments(
  patientId: string,
): Promise<PatientAppointmentWithRelations[]> {
  if (isDemoMockDataEnabled()) {
    return demoStore.getPatientAppointments(patientId);
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
        *,
        dentist:dentists(*),
        patient:patients(*)
      `,
    )
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PatientAppointmentWithRelations[];
}
