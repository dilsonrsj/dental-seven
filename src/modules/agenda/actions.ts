"use server";

import { revalidatePath } from "next/cache";
import { DEMO_CLINIC_ID, type AppointmentStatus } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentFormInput, AppointmentWithRelations } from "./types";

export async function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getAppointments(
  from: string,
  to: string,
  dentistId?: string,
): Promise<AppointmentWithRelations[]> {
  if (!(await isSupabaseConfigured())) return [];

  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      `
        *,
        dentist:dentists(*),
        patient:patients(*)
      `,
    )
    .eq("clinic_id", DEMO_CLINIC_ID)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true });

  if (dentistId && dentistId !== "all") {
    query = query.eq("dentist_id", dentistId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as AppointmentWithRelations[];
}

export async function getDentists() {
  if (!(await isSupabaseConfigured())) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentists")
    .select("*")
    .eq("clinic_id", DEMO_CLINIC_ID)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPatients() {
  if (!(await isSupabaseConfigured())) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", DEMO_CLINIC_ID)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertAppointment(input: AppointmentFormInput) {
  if (!(await isSupabaseConfigured())) {
    throw new Error("Configure .env.local");
  }

  const duration = Number(input.duration_min);
  const startsAt = parseAgendaDateTime(input.starts_at);
  const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);
  const payload = {
    clinic_id: DEMO_CLINIC_ID,
    dentist_id: input.dentist_id,
    patient_id: input.patient_id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    duration_min: duration,
    procedure_label: input.procedure_label.trim() || "Consulta",
    status: input.status,
    notes: input.notes?.trim() || null,
  };

  const supabase = await createClient();
  const { data, error } = input.id
    ? await supabase
        .from("appointments")
        .update(payload)
        .eq("id", input.id)
        .eq("clinic_id", DEMO_CLINIC_ID)
        .select(
          `
            *,
            dentist:dentists(*),
            patient:patients(*)
          `,
        )
        .single()
    : await supabase
        .from("appointments")
        .insert(payload)
        .select(
          `
            *,
            dentist:dentists(*),
            patient:patients(*)
          `,
        )
        .single();

  if (error) throw new Error(error.message);
  revalidatePath("/agenda");

  return data as AppointmentWithRelations;
}

function parseAgendaDateTime(value: string) {
  return new Date(value.includes("Z") ? value : `${value}:00.000Z`);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
) {
  if (!(await isSupabaseConfigured())) {
    throw new Error("Configure .env.local");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("clinic_id", DEMO_CLINIC_ID)
    .select(
      `
        *,
        dentist:dentists(*),
        patient:patients(*)
      `,
    )
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/agenda");

  return data as AppointmentWithRelations;
}
