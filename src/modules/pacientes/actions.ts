"use server";

import { revalidatePath } from "next/cache";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { demoStore } from "@/lib/demo/store";
import { DEMO_CLINIC_ID } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import type { PatientAppointmentWithRelations } from "./types";

export async function isSupabaseConfigured() {
  if (isDemoMockDataEnabled()) return true;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getPatients(search?: string) {
  if (isDemoMockDataEnabled()) {
    return demoStore.getPatients(search);
  }

  const supabase = await createClient();
  let query = supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", DEMO_CLINIC_ID)
    .order("name", { ascending: true });

  const term = search?.trim();
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(
      `name.ilike.${pattern},phone.ilike.${pattern},whatsapp.ilike.${pattern}`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getPatient(id: string) {
  if (isDemoMockDataEnabled()) {
    return demoStore.getPatient(id);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", DEMO_CLINIC_ID)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePatientNotes(id: string, notes: string) {
  if (isDemoMockDataEnabled()) {
    const data = demoStore.updatePatientNotes(id, notes);
    revalidatePath(`/pacientes/${id}`);
    revalidatePath("/pacientes");
    return data;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .update({ notes })
    .eq("clinic_id", DEMO_CLINIC_ID)
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
    .eq("clinic_id", DEMO_CLINIC_ID)
    .eq("patient_id", patientId)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PatientAppointmentWithRelations[];
}
