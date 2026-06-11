"use client";

import { Badge } from "@/components/ui";
import type { AppointmentStatus } from "@/lib/supabase/types";
import {
  getAppointmentsForDate,
  getWeekDays,
  toDateKey,
} from "./date-utils";
import type { AppointmentWithRelations } from "./types";

const HOURS = Array.from({ length: 11 }, (_, index) => index + 8);
const HOUR_HEIGHT = 72;

const statusLabels: Record<AppointmentStatus, string> = {
  confirmed: "Confirmada",
  pending: "Pendente",
  cancelled: "Cancelada",
  completed: "Concluída",
};

type WeekViewProps = {
  appointments: AppointmentWithRelations[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onEditAppointment: (appointment: AppointmentWithRelations) => void;
};

export function WeekView({
  appointments,
  selectedDate,
  onSelectDate,
  onEditAppointment,
}: WeekViewProps) {
  const weekDays = getWeekDays(selectedDate);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);

  return (
    <section className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <div className="grid min-w-[980px] grid-cols-[72px_repeat(7,minmax(120px,1fr))] border-b border-border">
        <div className="p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Hora
        </div>
        {weekDays.map((day) => {
          const dayKey = toDateKey(day);
          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`border-l border-border p-3 text-left transition-colors hover:bg-background ${
                dayKey === selectedKey ? "bg-primary/10" : ""
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {formatWeekday(day)}
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {day.getUTCDate()}
                {dayKey === todayKey && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    Hoje
                  </span>
                )}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className="grid min-w-[980px] grid-cols-[72px_repeat(7,minmax(120px,1fr))]"
        style={{ height: HOURS.length * HOUR_HEIGHT }}
      >
        <div className="relative border-r border-border">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="border-b border-border/70 px-3 pt-2 text-xs text-muted-foreground"
              style={{ height: HOUR_HEIGHT }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {weekDays.map((day) => (
          <div key={day.toISOString()} className="relative border-r border-border">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-border/70"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}
            {getAppointmentsForDate(appointments, day).map((appointment) => {
              const start = new Date(appointment.starts_at);
              const minutesFromStart =
                (start.getUTCHours() - 8) * 60 + start.getUTCMinutes();
              const top = Math.max(0, (minutesFromStart / 60) * HOUR_HEIGHT);
              const height = Math.max(
                44,
                (appointment.duration_min / 60) * HOUR_HEIGHT,
              );
              const color = appointment.dentist?.color ?? "var(--primary)";

              return (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => onEditAppointment(appointment)}
                  className="absolute left-2 right-2 overflow-hidden rounded-xl border border-border bg-background p-2 text-left text-xs shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary"
                  style={{
                    top,
                    height,
                    borderLeft: `4px solid ${color}`,
                  }}
                >
                  <p className="font-semibold text-foreground">
                    {formatTime(start)} · {appointment.patient?.name}
                  </p>
                  <p className="mt-1 truncate text-muted-foreground">
                    {appointment.procedure_label}
                  </p>
                  <Badge className="mt-2 bg-surface">
                    {statusLabels[appointment.status]}
                  </Badge>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}
