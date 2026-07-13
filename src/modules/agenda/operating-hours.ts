export type DaySchedule = {
  dayOfWeek: number;
  isOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

export const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;

export const DEFAULT_WEEKDAY_HOURS = {
  opensAt: "08:00",
  closesAt: "18:00",
} as const;

export function createDefaultClinicSchedule(): DaySchedule[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isOpen: dayOfWeek <= 4,
    opensAt: dayOfWeek <= 4 ? DEFAULT_WEEKDAY_HOURS.opensAt : null,
    closesAt: dayOfWeek <= 4 ? DEFAULT_WEEKDAY_HOURS.closesAt : null,
  }));
}

/** Seg=0 … Dom=6 (alinhado à grade getWeekDays). */
export function getOperatingDayOfWeek(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function normalizeTimeValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function timeToMinutes(value: string | null | undefined): number | null {
  const normalized = normalizeTimeValue(value);
  if (!normalized) return null;
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

export function scheduleByDay(schedules: DaySchedule[]): Map<number, DaySchedule> {
  return new Map(schedules.map((entry) => [entry.dayOfWeek, entry]));
}

export function getScheduleForDate(
  schedules: DaySchedule[],
  date: Date,
): DaySchedule | undefined {
  return scheduleByDay(schedules).get(getOperatingDayOfWeek(date));
}

export function validateDaySchedule(entry: DaySchedule): string | null {
  if (!entry.isOpen) {
    if (entry.opensAt || entry.closesAt) {
      return "Dias fechados não devem ter horário.";
    }
    return null;
  }

  const opens = timeToMinutes(entry.opensAt);
  const closes = timeToMinutes(entry.closesAt);
  if (opens === null || closes === null) {
    return "Informe início e fim para dias abertos.";
  }
  if (opens >= closes) {
    return "Horário de início deve ser anterior ao fim.";
  }
  return null;
}

export function validateClinicSchedule(schedules: DaySchedule[]): string | null {
  if (schedules.length !== 7) return "Informe os 7 dias da semana.";
  for (const entry of schedules) {
    const error = validateDaySchedule(entry);
    if (error) return error;
  }
  return null;
}

export function validateDentistWithinClinic(
  dentistSchedules: DaySchedule[],
  clinicSchedules: DaySchedule[],
): string | null {
  const clinicByDay = scheduleByDay(clinicSchedules);

  for (const dentistDay of dentistSchedules) {
    const clinicDay = clinicByDay.get(dentistDay.dayOfWeek);
    if (!clinicDay) return "Horário da clínica incompleto.";

    if (dentistDay.isOpen && !clinicDay.isOpen) {
      return `${DAY_LABELS[dentistDay.dayOfWeek]}: clínica fechada neste dia.`;
    }

    if (!dentistDay.isOpen) continue;

    const dentistOpens = timeToMinutes(dentistDay.opensAt);
    const dentistCloses = timeToMinutes(dentistDay.closesAt);
    const clinicOpens = timeToMinutes(clinicDay.opensAt);
    const clinicCloses = timeToMinutes(clinicDay.closesAt);

    if (
      dentistOpens === null ||
      dentistCloses === null ||
      clinicOpens === null ||
      clinicCloses === null
    ) {
      return "Horários inválidos.";
    }

    if (dentistOpens < clinicOpens || dentistCloses > clinicCloses) {
      return `${DAY_LABELS[dentistDay.dayOfWeek]}: horário do dentista deve ficar dentro do horário da clínica.`;
    }
  }

  return null;
}

export function getEffectiveDaySchedule(
  clinicSchedule: DaySchedule | undefined,
  dentistSchedule: DaySchedule | undefined,
): DaySchedule {
  if (!clinicSchedule?.isOpen) {
    return {
      dayOfWeek: clinicSchedule?.dayOfWeek ?? dentistSchedule?.dayOfWeek ?? 0,
      isOpen: false,
      opensAt: null,
      closesAt: null,
    };
  }

  if (!dentistSchedule?.isOpen) {
    return { ...clinicSchedule, isOpen: false, opensAt: null, closesAt: null };
  }

  const clinicOpens = timeToMinutes(clinicSchedule.opensAt)!;
  const clinicCloses = timeToMinutes(clinicSchedule.closesAt)!;
  const dentistOpens = timeToMinutes(dentistSchedule.opensAt)!;
  const dentistCloses = timeToMinutes(dentistSchedule.closesAt)!;

  return {
    dayOfWeek: clinicSchedule.dayOfWeek,
    isOpen: true,
    opensAt: minutesToTime(Math.max(clinicOpens, dentistOpens)),
    closesAt: minutesToTime(Math.min(clinicCloses, dentistCloses)),
  };
}

export function computeWeekGridBounds(
  weekDays: Date[],
  effectiveSchedules: DaySchedule[],
): { startHour: number; endHour: number } {
  const openDays = effectiveSchedules.filter((day) => day.isOpen);
  if (openDays.length === 0) {
    return { startHour: 8, endHour: 18 };
  }

  const opens = openDays
    .map((day) => timeToMinutes(day.opensAt))
    .filter((value): value is number => value !== null);
  const closes = openDays
    .map((day) => timeToMinutes(day.closesAt))
    .filter((value): value is number => value !== null);

  const startHour = Math.floor(Math.min(...opens) / 60);
  const endHour = Math.ceil(Math.max(...closes) / 60);

  return { startHour, endHour: Math.max(startHour + 1, endHour) };
}

export function buildHourRange(startHour: number, endHour: number): number[] {
  return Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
}

export function assertAppointmentWithinSchedule(
  startsAt: Date,
  durationMin: number,
  clinicSchedule: DaySchedule,
  dentistSchedule: DaySchedule,
): void {
  const effective = getEffectiveDaySchedule(clinicSchedule, dentistSchedule);
  if (!effective.isOpen) {
    throw new Error("A clínica ou o dentista não atende neste dia.");
  }

  const startMinutes = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
  const endMinutes = startMinutes + durationMin;
  const opens = timeToMinutes(effective.opensAt)!;
  const closes = timeToMinutes(effective.closesAt)!;

  if (startMinutes < opens || endMinutes > closes) {
    throw new Error("Horário fora do expediente configurado.");
  }
}

export function mapRowsToSchedule(
  rows: {
    day_of_week: number;
    is_open: boolean;
    opens_at: string | null;
    closes_at: string | null;
  }[],
): DaySchedule[] {
  const byDay = new Map(rows.map((row) => [row.day_of_week, row]));
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = byDay.get(dayOfWeek);
    if (!row) {
      return { dayOfWeek, isOpen: false, opensAt: null, closesAt: null };
    }
    return {
      dayOfWeek,
      isOpen: row.is_open,
      opensAt: normalizeTimeValue(row.opens_at),
      closesAt: normalizeTimeValue(row.closes_at),
    };
  });
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatWeekRangeLabel(weekDays: Date[]): string {
  const start = weekDays[0];
  const end = weekDays[6];
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const year = end.getUTCFullYear();
  return `${formatter.format(start)} – ${formatter.format(end)} ${year}`;
}

export function shiftWeek(date: Date, deltaWeeks: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + deltaWeeks * 7);
  return next;
}

export function computeEffectiveWeekSchedules(input: {
  weekDays: Date[];
  clinicSchedule: DaySchedule[];
  dentistSchedulesById: Map<string, DaySchedule[]>;
  selectedDentistId: string | "all";
  activeDentistIds: string[];
}): DaySchedule[] {
  const clinicByDay = scheduleByDay(input.clinicSchedule);

  return input.weekDays.map((date) => {
    const dayOfWeek = getOperatingDayOfWeek(date);
    const clinicDay = clinicByDay.get(dayOfWeek);

    if (input.selectedDentistId !== "all") {
      const dentistRows =
        input.dentistSchedulesById.get(input.selectedDentistId) ?? [];
      const dentistSchedule =
        dentistRows.length > 0 ? dentistRows : input.clinicSchedule;
      const dentistDay = scheduleByDay(dentistSchedule).get(dayOfWeek);
      return getEffectiveDaySchedule(clinicDay, dentistDay);
    }

    const dentistDays = input.activeDentistIds
      .map((id) => {
        const rows = input.dentistSchedulesById.get(id) ?? [];
        const schedule = rows.length > 0 ? rows : input.clinicSchedule;
        return scheduleByDay(schedule).get(dayOfWeek);
      })
      .filter((day): day is DaySchedule => Boolean(day?.isOpen));

    if (!clinicDay?.isOpen || dentistDays.length === 0) {
      return getEffectiveDaySchedule(clinicDay, undefined);
    }

    const opens = Math.max(
      timeToMinutes(clinicDay.opensAt)!,
      Math.min(...dentistDays.map((day) => timeToMinutes(day.opensAt)!)),
    );
    const closes = Math.min(
      timeToMinutes(clinicDay.closesAt)!,
      Math.max(...dentistDays.map((day) => timeToMinutes(day.closesAt)!)),
    );

    if (opens >= closes) {
      return { dayOfWeek, isOpen: false, opensAt: null, closesAt: null };
    }

    return {
      dayOfWeek,
      isOpen: true,
      opensAt: minutesToTime(opens),
      closesAt: minutesToTime(closes),
    };
  });
}
