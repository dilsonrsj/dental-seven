"use client";

import { OperatingHoursForm } from "@/modules/agenda/operating-hours-form";
import type { DaySchedule } from "@/modules/agenda/operating-hours";
import { updateDentistOperatingHours } from "@/modules/agenda/operating-hours-actions";

type DentistHoursFormProps = {
  dentistId: string;
  initialSchedule: DaySchedule[];
  canWrite: boolean;
};

export function DentistHoursForm({
  dentistId,
  initialSchedule,
  canWrite,
}: DentistHoursFormProps) {
  return (
    <OperatingHoursForm
      initialSchedule={initialSchedule}
      canWrite={canWrite}
      description="Horários de atendimento deste dentista, dentro do expediente da clínica."
      onSave={(schedules) => updateDentistOperatingHours(dentistId, schedules)}
    />
  );
}
