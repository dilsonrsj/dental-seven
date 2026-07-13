"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, toast } from "@/components/ui";
import { useDentistFilter } from "@/contexts/dentist-filter-context";
import type { AppointmentStatus } from "@/lib/supabase/types";
import {
  getAppointments,
  updateAppointmentStatus,
  upsertAppointment,
} from "./actions";
import { AgendaToolbar, type AgendaViewMode } from "./agenda-toolbar";
import { AppointmentModal } from "./appointment-modal";
import { DayView } from "./day-view";
import { filterAppointmentsByDentist, getWeekDays } from "./date-utils";
import {
  computeEffectiveWeekSchedules,
  computeWeekGridBounds,
  shiftWeek,
} from "./operating-hours";
import { WeekView } from "./week-view";
import type {
  AgendaInitialData,
  AppointmentFormInput,
  AppointmentWithRelations,
  InsurancePlanChoice,
} from "./types";
import type { ProcedureRow } from "@/modules/procedimentos/types";

type AgendaPageClientProps = AgendaInitialData & {
  configureMessage?: string;
  catalogProcedures?: ProcedureRow[];
  insurancePlans?: InsurancePlanChoice[];
  primaryPlanByPatient?: Record<string, string>;
  initialPatientId?: string;
};

export function AgendaPageClient({
  appointments: initialAppointments,
  dentists,
  patients,
  operatingHours,
  catalogProcedures = [],
  insurancePlans = [],
  primaryPlanByPatient = {},
  configureMessage,
  initialPatientId,
}: AgendaPageClientProps) {
  const [appointments, setAppointments] =
    useState<AppointmentWithRelations[]>(initialAppointments);
  const [selectedDate, setSelectedDate] = useState(() => startOfTodayUtc());
  const [mode, setMode] = useState<AgendaViewMode>("day");
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentWithRelations | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { selectedDentistId } = useDentistFilter();

  const filteredAppointments = useMemo(
    () => filterAppointmentsByDentist(appointments, selectedDentistId),
    [appointments, selectedDentistId],
  );

  const weekDays = useMemo(
    () => getWeekDays(selectedDate),
    [selectedDate],
  );

  const dentistSchedulesById = useMemo(
    () => new Map(Object.entries(operatingHours.dentistSchedulesById)),
    [operatingHours.dentistSchedulesById],
  );

  const effectiveSchedules = useMemo(
    () =>
      computeEffectiveWeekSchedules({
        weekDays,
        clinicSchedule: operatingHours.clinicSchedule,
        dentistSchedulesById,
        selectedDentistId,
        activeDentistIds: dentists.map((dentist) => dentist.id),
      }),
    [
      weekDays,
      operatingHours.clinicSchedule,
      dentistSchedulesById,
      selectedDentistId,
      dentists,
    ],
  );

  const { startHour, endHour } = useMemo(
    () => computeWeekGridBounds(weekDays, effectiveSchedules),
    [weekDays, effectiveSchedules],
  );

  async function reloadAppointments(date = selectedDate) {
    const [weekStart, , , , , , weekEnd] = getWeekDays(date);
    const from = weekStart.toISOString();
    const to = endOfDayUtc(weekEnd).toISOString();
    const nextAppointments = await getAppointments(from, to);
    setAppointments(nextAppointments);
  }

  function handleModeChange(nextMode: AgendaViewMode) {
    setMode(nextMode);
    if (nextMode === "day") {
      setSelectedDate(startOfTodayUtc());
    }
  }

  async function navigateWeek(deltaWeeks: number) {
    const nextDate = shiftWeek(selectedDate, deltaWeeks);
    setSelectedDate(nextDate);
    await reloadAppointments(nextDate);
  }

  async function goToToday() {
    const today = startOfTodayUtc();
    setSelectedDate(today);
    await reloadAppointments(today);
  }

  function openNewAppointment() {
    setEditingAppointment(null);
    setModalOpen(true);
  }

  function openEditAppointment(appointment: AppointmentWithRelations) {
    setEditingAppointment(appointment);
    setSelectedDate(new Date(appointment.starts_at));
    setModalOpen(true);
  }

  async function handleSubmit(input: AppointmentFormInput) {
    try {
      setIsSaving(true);
      const { stockResult, financeResult } = await upsertAppointment(input);
      await reloadAppointments(new Date(input.starts_at));
      setModalOpen(false);
      toast.success("Consulta salva.");
      if (stockResult?.applied) {
        toast.success("Estoque atualizado");
      }
      if (financeResult?.applied) {
        toast.success("Financeiro atualizado");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    try {
      setIsSaving(true);
      const { appointment: updated, stockResult, financeResult } =
        await updateAppointmentStatus(id, status);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === updated.id ? updated : appointment,
        ),
      );
      if (editingAppointment?.id === updated.id) {
        setEditingAppointment(updated);
      }
      toast.success("Status atualizado.");
      if (stockResult?.applied) {
        toast.success("Estoque atualizado");
      }
      if (financeResult?.applied) {
        toast.success("Financeiro atualizado");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (configureMessage) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Agenda
        </h1>
        <Card>
          <CardContent>
            <p className="font-medium">{configureMessage}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Defina `NEXT_PUBLIC_SUPABASE_URL` e
              `NEXT_PUBLIC_SUPABASE_ANON_KEY` para carregar os dados demo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AgendaToolbar
        mode={mode}
        selectedDate={selectedDate}
        onModeChange={handleModeChange}
        onNewAppointment={openNewAppointment}
        onPreviousWeek={() => void navigateWeek(-1)}
        onNextWeek={() => void navigateWeek(1)}
        onToday={() => void goToToday()}
        dentists={dentists}
      />

      {mode === "week" ? (
        <WeekView
          appointments={filteredAppointments}
          selectedDate={selectedDate}
          startHour={startHour}
          endHour={endHour}
          effectiveSchedules={effectiveSchedules}
          onSelectDate={setSelectedDate}
          onEditAppointment={openEditAppointment}
        />
      ) : (
        <DayView
          appointments={filteredAppointments}
          selectedDate={selectedDate}
          onEditAppointment={openEditAppointment}
          onStatusChange={handleStatusChange}
          isSaving={isSaving}
        />
      )}

      <AppointmentModal
        open={modalOpen}
        appointment={editingAppointment}
        dentists={dentists}
        patients={patients}
        catalogProcedures={catalogProcedures}
        insurancePlans={insurancePlans}
        primaryPlanByPatient={primaryPlanByPatient}
        selectedDate={selectedDate}
        initialPatientId={initialPatientId}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onStatusChange={handleStatusChange}
        isSaving={isSaving}
      />
    </div>
  );
}

function startOfTodayUtc() {
  const today = new Date();
  return new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 8),
  );
}

function endOfDayUtc(date: Date) {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao salvar consulta.";
}
