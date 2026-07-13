"use client";

import { Button } from "@/components/ui";
import { useDentistFilter } from "@/contexts/dentist-filter-context";
import type { Dentist } from "@/lib/supabase/types";
import { formatWeekRangeLabel } from "./operating-hours";
import { getWeekDays } from "./date-utils";

type AgendaViewMode = "week" | "day";

type AgendaToolbarProps = {
  mode: AgendaViewMode;
  selectedDate: Date;
  onModeChange: (mode: AgendaViewMode) => void;
  onNewAppointment: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  dentists: Dentist[];
};

export function AgendaToolbar({
  mode,
  selectedDate,
  onModeChange,
  onNewAppointment,
  onPreviousWeek,
  onNextWeek,
  onToday,
  dentists,
}: AgendaToolbarProps) {
  const { selectedDentistId } = useDentistFilter();
  const selectedDentist = dentists.find(
    (dentist) => dentist.id === selectedDentistId,
  );
  const weekLabel = formatWeekRangeLabel(getWeekDays(selectedDate));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Agenda demo</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Consultas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filtro ativo: {selectedDentist?.name ?? "Todos os dentistas"}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        {mode === "week" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={onPreviousWeek}>
              ← Anterior
            </Button>
            <span className="min-w-[180px] text-center text-sm font-medium">
              {weekLabel}
            </span>
            <Button type="button" variant="outline" onClick={onNextWeek}>
              Próxima →
            </Button>
            <Button type="button" variant="ghost" onClick={onToday}>
              Hoje
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <div className="grid grid-cols-2 rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => onModeChange("week")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semana
            </button>
            <button
              type="button"
              onClick={() => onModeChange("day")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mode === "day"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hoje
            </button>
          </div>
          <Button type="button" onClick={onNewAppointment}>
            Nova consulta
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { AgendaViewMode };
