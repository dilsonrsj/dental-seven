"use client";

import { OperatingHoursForm } from "@/modules/agenda/operating-hours-form";
import type { DaySchedule } from "@/modules/agenda/operating-hours";
import { updateClinicOperatingHours } from "@/modules/agenda/operating-hours-actions";

type ClinicHoursFormProps = {
  initialSchedule: DaySchedule[];
  canWrite: boolean;
};

export function ClinicHoursForm({ initialSchedule, canWrite }: ClinicHoursFormProps) {
  return (
    <OperatingHoursForm
      initialSchedule={initialSchedule}
      canWrite={canWrite}
      description="Define os dias e horários de funcionamento da clínica. A grade da agenda usa estes limites."
      onSave={updateClinicOperatingHours}
    />
  );
}
