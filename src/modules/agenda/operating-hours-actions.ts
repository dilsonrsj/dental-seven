"use server";

import { revalidatePath } from "next/cache";
import {
  getAuthContext,
  requireAuthContext,
  requireClinicId,
  type AuthContext,
} from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { createClient } from "@/lib/supabase/server";
import {
  createDefaultClinicSchedule,
  mapRowsToSchedule,
  validateClinicSchedule,
  validateDentistWithinClinic,
  type DaySchedule,
} from "./operating-hours";

async function assertWritable() {
  const ctx = await getAuthContext();
  if (
    !ctx?.clinic ||
    isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)
  ) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

async function assertClinicAdminWritable() {
  const ctx = await getAuthContext();
  if (!ctx?.clinic) throw new Error("Clínica não encontrada.");
  if (ctx.profile.role !== "clinic_admin") {
    throw new Error("Somente o administrador da clínica pode editar horários.");
  }
  await assertWritable();
}

async function assertCanEditDentistHours(dentistId: string, ctx: AuthContext) {
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data: dentist, error } = await supabase
    .from("dentists")
    .select("id, clinic_id")
    .eq("id", dentistId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!dentist) throw new Error("Dentista não encontrado.");

  const isAdmin = ctx.profile.role === "clinic_admin";
  const isOwnProfile = ctx.profile.dentist_id === dentistId;

  if (!isAdmin && !isOwnProfile) {
    throw new Error("Sem permissão para editar estes horários.");
  }
}

export type AgendaOperatingHoursData = {
  clinicSchedule: DaySchedule[];
  dentistSchedulesById: Record<string, DaySchedule[]>;
};

export async function getClinicOperatingHours(): Promise<DaySchedule[] | null> {
  if (isDemoMockDataEnabled()) return createDefaultClinicSchedule();

  const ctx = await requireAuthContext();
  if (!ctx.clinic || ctx.profile.role !== "clinic_admin") return null;

  return loadClinicSchedule(await requireClinicId());
}

export async function getDentistOperatingHours(
  dentistId: string,
): Promise<DaySchedule[] | null> {
  if (isDemoMockDataEnabled()) return createDefaultClinicSchedule();

  const ctx = await requireAuthContext();
  if (!ctx.clinic) return null;

  const isAdmin = ctx.profile.role === "clinic_admin";
  const isOwnProfile = ctx.profile.dentist_id === dentistId;
  if (!isAdmin && !isOwnProfile) return null;

  return loadDentistSchedule(dentistId);
}

export async function getAgendaOperatingHours(): Promise<AgendaOperatingHoursData> {
  if (isDemoMockDataEnabled()) {
    const schedule = createDefaultClinicSchedule();
    return { clinicSchedule: schedule, dentistSchedulesById: {} };
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();

  const [clinicSchedule, dentistRows] = await Promise.all([
    loadClinicSchedule(clinicId),
    supabase
      .from("dentist_operating_hours")
      .select("dentist_id, day_of_week, is_open, opens_at, closes_at")
      .eq("clinic_id", clinicId),
  ]);

  if (dentistRows.error) throw new Error(dentistRows.error.message);

  const dentistSchedulesById: Record<string, DaySchedule[]> = {};
  const rowsByDentist = new Map<string, typeof dentistRows.data>();

  for (const row of dentistRows.data ?? []) {
    const current = rowsByDentist.get(row.dentist_id) ?? [];
    current.push(row);
    rowsByDentist.set(row.dentist_id, current);
  }

  for (const [dentistId, rows] of rowsByDentist) {
    dentistSchedulesById[dentistId] = mapRowsToSchedule(rows);
  }

  return { clinicSchedule, dentistSchedulesById };
}

export async function updateClinicOperatingHours(
  schedules: DaySchedule[],
): Promise<void> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Indisponível no modo demo.");
  }

  await assertClinicAdminWritable();

  const validationError = validateClinicSchedule(schedules);
  if (validationError) throw new Error(validationError);

  const clinicId = await requireClinicId();
  const supabase = await createClient();

  const rows = schedules.map((entry) => ({
    clinic_id: clinicId,
    day_of_week: entry.dayOfWeek,
    is_open: entry.isOpen,
    opens_at: entry.isOpen ? entry.opensAt : null,
    closes_at: entry.isOpen ? entry.closesAt : null,
  }));

  const { error } = await supabase.from("clinic_operating_hours").upsert(rows, {
    onConflict: "clinic_id,day_of_week",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/configuracoes");
  revalidatePath("/agenda");
}

export async function updateDentistOperatingHours(
  dentistId: string,
  schedules: DaySchedule[],
): Promise<void> {
  if (isDemoMockDataEnabled()) {
    throw new Error("Indisponível no modo demo.");
  }

  const ctx = await requireAuthContext();
  await assertWritable();
  await assertCanEditDentistHours(dentistId, ctx);

  const validationError = validateClinicSchedule(schedules);
  if (validationError) throw new Error(validationError);

  const clinicId = await requireClinicId();
  const clinicSchedule = await loadClinicSchedule(clinicId);
  const withinClinicError = validateDentistWithinClinic(schedules, clinicSchedule);
  if (withinClinicError) throw new Error(withinClinicError);

  const supabase = await createClient();
  const rows = schedules.map((entry) => ({
    dentist_id: dentistId,
    clinic_id: clinicId,
    day_of_week: entry.dayOfWeek,
    is_open: entry.isOpen,
    opens_at: entry.isOpen ? entry.opensAt : null,
    closes_at: entry.isOpen ? entry.closesAt : null,
  }));

  const { error } = await supabase.from("dentist_operating_hours").upsert(rows, {
    onConflict: "dentist_id,day_of_week",
  });

  if (error) throw new Error(error.message);

  revalidatePath("/configuracoes");
  revalidatePath("/agenda");
}

async function loadClinicSchedule(clinicId: string): Promise<DaySchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clinic_operating_hours")
    .select("day_of_week, is_open, opens_at, closes_at")
    .eq("clinic_id", clinicId);

  if (error) throw new Error(error.message);
  if (!data?.length) return createDefaultClinicSchedule();

  return mapRowsToSchedule(data);
}

async function loadDentistSchedule(dentistId: string): Promise<DaySchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentist_operating_hours")
    .select("day_of_week, is_open, opens_at, closes_at")
    .eq("dentist_id", dentistId);

  if (error) throw new Error(error.message);
  if (!data?.length) {
    const clinicId = await requireClinicId();
    return loadClinicSchedule(clinicId);
  }

  return mapRowsToSchedule(data);
}

export async function loadOperatingHoursForAppointment(
  dentistId: string,
  startsAt: Date,
): Promise<{ clinicDay: DaySchedule; dentistDay: DaySchedule }> {
  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const dayOfWeek =
    startsAt.getUTCDay() === 0 ? 6 : startsAt.getUTCDay() - 1;

  const [clinicResult, dentistResult] = await Promise.all([
    supabase
      .from("clinic_operating_hours")
      .select("day_of_week, is_open, opens_at, closes_at")
      .eq("clinic_id", clinicId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle(),
    supabase
      .from("dentist_operating_hours")
      .select("day_of_week, is_open, opens_at, closes_at")
      .eq("dentist_id", dentistId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle(),
  ]);

  if (clinicResult.error) throw new Error(clinicResult.error.message);
  if (dentistResult.error) throw new Error(dentistResult.error.message);

  const clinicSchedule = await loadClinicSchedule(clinicId);
  const clinicDay = clinicResult.data
    ? mapRowsToSchedule([clinicResult.data])[dayOfWeek]
    : (clinicSchedule.find((day) => day.dayOfWeek === dayOfWeek) ?? {
        dayOfWeek,
        isOpen: false,
        opensAt: null,
        closesAt: null,
      });

  const dentistSchedule = dentistResult.data
    ? mapRowsToSchedule([dentistResult.data])
    : clinicSchedule;
  const dentistDay =
    dentistSchedule.find((day) => day.dayOfWeek === dayOfWeek) ?? clinicDay;

  return { clinicDay, dentistDay };
}
