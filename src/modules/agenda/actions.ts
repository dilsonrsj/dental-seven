"use server";

import { revalidatePath } from "next/cache";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { demoStore } from "@/lib/demo/store";
import { getAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { type AppointmentStatus } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { applyStockForAppointmentStatusChange } from "@/modules/estoque/appointment-stock";
import { applyFinanceForAppointmentStatusChange } from "@/modules/financeiro/appointment-finance";
import { createClaimForAppointment } from "@/modules/convenios/actions";
import {
  findDentistScheduleConflict,
  SCHEDULE_CONFLICT_MESSAGE,
} from "./appointment-overlap";
import { assertAppointmentWithinSchedule } from "./operating-hours";
import { loadOperatingHoursForAppointment } from "./operating-hours-actions";
import type { AppointmentFormInput, AppointmentWithRelations } from "./types";

export type AppointmentMutationResult = {
  appointment: AppointmentWithRelations;
  stockResult?: { applied: boolean; reversed: boolean };
  financeResult?: { applied: boolean; reversed: boolean };
};

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim();
}

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

export async function getAppointments(
  from: string,
  to: string,
  dentistId?: string,
): Promise<AppointmentWithRelations[]> {
  if (isDemoMockDataEnabled()) {
    return demoStore.getAppointments(from, to, dentistId);
  }

  const clinicId = await requireClinicId();
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
    .eq("clinic_id", clinicId)
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
  if (isDemoMockDataEnabled()) {
    return demoStore.getDentists();
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dentists")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPatients() {
  if (isDemoMockDataEnabled()) {
    return demoStore.getPatients();
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertAppointment(
  input: AppointmentFormInput,
): Promise<AppointmentMutationResult> {
  if (!isDemoMockDataEnabled()) {
    if (!(await isSupabaseConfigured())) {
      throw new Error("Configure .env.local");
    }
    await assertWritable();
  }

  const duration = Number(input.duration_min);
  const startsAt = parseAgendaDateTime(input.starts_at);
  const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);
  const paymentSource = input.payment_source ?? "particular";
  const insurancePlanId =
    paymentSource === "insurance"
      ? uuidOrNull(input.insurance_plan_id)
      : null;

  if (paymentSource === "insurance" && !insurancePlanId) {
    throw new Error("Selecione o plano do convênio.");
  }

  const payload = {
    patient_id: input.patient_id,
    dentist_id: input.dentist_id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    duration_min: duration,
    procedure_id: uuidOrNull(input.procedure_id ?? undefined),
    procedure_label: input.procedure_label.trim() || "Consulta",
    status: input.status,
    notes: input.notes?.trim() || null,
    payment_source: paymentSource,
    insurance_plan_id: insurancePlanId,
  };

  if (isDemoMockDataEnabled()) {
    if (payload.status !== "cancelled") {
      const conflict = findDentistScheduleConflict(
        {
          id: input.id,
          dentist_id: payload.dentist_id,
          starts_at: payload.starts_at,
          ends_at: payload.ends_at,
          status: payload.status,
        },
        demoStore
          .getAppointments(
            "1970-01-01T00:00:00.000Z",
            "2100-01-01T00:00:00.000Z",
          )
          .map((row) => ({
            id: row.id,
            dentist_id: row.dentist_id,
            starts_at: row.starts_at,
            ends_at: row.ends_at,
            status: row.status,
          })),
      );
      if (conflict) {
        throw new Error(SCHEDULE_CONFLICT_MESSAGE);
      }
    }
    const data = demoStore.upsertAppointment({ id: input.id, ...payload });
    revalidatePath("/agenda");
    return { appointment: data };
  }

  const clinicId = await requireClinicId();
  const { clinicDay, dentistDay } = await loadOperatingHoursForAppointment(
    input.dentist_id,
    startsAt,
  );
  assertAppointmentWithinSchedule(
    startsAt,
    duration,
    clinicDay,
    dentistDay,
  );

  const supabase = await createClient();

  if (payload.status !== "cancelled") {
    let conflictQuery = supabase
      .from("appointments")
      .select("id, dentist_id, starts_at, ends_at, status")
      .eq("clinic_id", clinicId)
      .eq("dentist_id", input.dentist_id)
      .neq("status", "cancelled")
      .lt("starts_at", endsAt.toISOString())
      .gt("ends_at", startsAt.toISOString());

    if (input.id) {
      conflictQuery = conflictQuery.neq("id", input.id);
    }

    const { data: conflictRows, error: conflictError } = await conflictQuery;
    if (conflictError) throw new Error(conflictError.message);

    const conflict = findDentistScheduleConflict(
      {
        id: input.id,
        dentist_id: payload.dentist_id,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        status: payload.status,
      },
      conflictRows ?? [],
    );
    if (conflict) {
      throw new Error(SCHEDULE_CONFLICT_MESSAGE);
    }
  }

  const fullPayload = { ...payload, clinic_id: clinicId };

  let previousStatus: AppointmentStatus = "pending";
  if (input.id) {
    const { data: existing, error: fetchError } = await supabase
      .from("appointments")
      .select("status")
      .eq("id", input.id)
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (existing) {
      previousStatus = existing.status as AppointmentStatus;
    }
  }

  const { data, error } = input.id
    ? await supabase
        .from("appointments")
        .update(fullPayload)
        .eq("id", input.id)
        .eq("clinic_id", clinicId)
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
        .insert(fullPayload)
        .select(
          `
            *,
            dentist:dentists(*),
            patient:patients(*)
          `,
        )
        .single();

  if (error) throw new Error(error.message);

  let stockResult: { applied: boolean; reversed: boolean } | undefined;
  let financeResult: { applied: boolean; reversed: boolean } | undefined;
  if (previousStatus !== input.status) {
    stockResult = await applyStockForAppointmentStatusChange(
      data.id,
      previousStatus,
      input.status,
    );
    if (stockResult.applied || stockResult.reversed) {
      revalidatePath("/estoque");
    }

    financeResult = await applyFinanceForAppointmentStatusChange(
      data.id,
      previousStatus,
      input.status,
      { revenueAmountCents: input.charged_amount_cents },
    );
    if (financeResult.applied || financeResult.reversed) {
      revalidatePath("/financeiro");
    }

    if (previousStatus !== "completed" && input.status === "completed") {
      await createClaimForAppointment(data.id);
    }
  }

  revalidatePath("/agenda");

  return {
    appointment: data as AppointmentWithRelations,
    stockResult,
    financeResult,
  };
}

function parseAgendaDateTime(value: string) {
  return new Date(value.includes("Z") ? value : `${value}:00.000Z`);
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<AppointmentMutationResult> {
  if (isDemoMockDataEnabled()) {
    if (status !== "cancelled") {
      const current = demoStore
        .getAppointments(
          "1970-01-01T00:00:00.000Z",
          "2100-01-01T00:00:00.000Z",
        )
        .find((row) => row.id === id);
      if (current) {
        const conflict = findDentistScheduleConflict(
          {
            id: current.id,
            dentist_id: current.dentist_id,
            starts_at: current.starts_at,
            ends_at: current.ends_at,
            status,
          },
          demoStore
            .getAppointments(
              "1970-01-01T00:00:00.000Z",
              "2100-01-01T00:00:00.000Z",
            )
            .map((row) => ({
              id: row.id,
              dentist_id: row.dentist_id,
              starts_at: row.starts_at,
              ends_at: row.ends_at,
              status: row.status,
            })),
        );
        if (conflict) {
          throw new Error(SCHEDULE_CONFLICT_MESSAGE);
        }
      }
    }
    const data = demoStore.updateAppointmentStatus(id, status);
    revalidatePath("/agenda");
    return { appointment: data };
  }
  await assertWritable();

  const clinicId = await requireClinicId();
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("id, dentist_id, starts_at, ends_at, status")
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  const previousStatus = existing.status as AppointmentStatus;

  if (status !== "cancelled") {
    const { data: conflictRows, error: conflictError } = await supabase
      .from("appointments")
      .select("id, dentist_id, starts_at, ends_at, status")
      .eq("clinic_id", clinicId)
      .eq("dentist_id", existing.dentist_id)
      .neq("status", "cancelled")
      .neq("id", id)
      .lt("starts_at", existing.ends_at)
      .gt("ends_at", existing.starts_at);

    if (conflictError) throw new Error(conflictError.message);

    const conflict = findDentistScheduleConflict(
      {
        id: existing.id,
        dentist_id: existing.dentist_id,
        starts_at: existing.starts_at,
        ends_at: existing.ends_at,
        status,
      },
      conflictRows ?? [],
    );
    if (conflict) {
      throw new Error(SCHEDULE_CONFLICT_MESSAGE);
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select(
      `
        *,
        dentist:dentists(*),
        patient:patients(*)
      `,
    )
    .single();

  if (error) throw new Error(error.message);

  let stockResult: { applied: boolean; reversed: boolean } | undefined;
  let financeResult: { applied: boolean; reversed: boolean } | undefined;
  if (previousStatus !== status) {
    stockResult = await applyStockForAppointmentStatusChange(
      id,
      previousStatus,
      status,
    );
    if (stockResult.applied || stockResult.reversed) {
      revalidatePath("/estoque");
    }

    financeResult = await applyFinanceForAppointmentStatusChange(
      id,
      previousStatus,
      status,
    );
    if (financeResult.applied || financeResult.reversed) {
      revalidatePath("/financeiro");
    }

    if (previousStatus !== "completed" && status === "completed") {
      await createClaimForAppointment(id);
    }
  }

  revalidatePath("/agenda");

  return {
    appointment: data as AppointmentWithRelations,
    stockResult,
    financeResult,
  };
}

export async function deleteAppointment(id: string): Promise<void> {
  if (isDemoMockDataEnabled()) {
    demoStore.deleteAppointment(id);
    revalidatePath("/agenda");
    return;
  }

  await assertWritable();
  const clinicId = await requireClinicId();
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Consulta não encontrada.");

  if (existing.status === "completed") {
    await applyStockForAppointmentStatusChange(id, "completed", "cancelled");
    await applyFinanceForAppointmentStatusChange(id, "completed", "cancelled");
  }

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) throw new Error(error.message);

  revalidatePath("/agenda");
  revalidatePath("/estoque");
  revalidatePath("/financeiro");
}
