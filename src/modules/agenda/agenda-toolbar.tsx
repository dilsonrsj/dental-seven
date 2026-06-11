"use client";

import { Button } from "@/components/ui";
import { useDentistFilter } from "@/contexts/dentist-filter-context";
import type { Dentist } from "@/lib/supabase/types";

type AgendaViewMode = "week" | "day";

type AgendaToolbarProps = {
  mode: AgendaViewMode;
  onModeChange: (mode: AgendaViewMode) => void;
  onNewAppointment: () => void;
  dentists: Dentist[];
};

export function AgendaToolbar({
  mode,
  onModeChange,
  onNewAppointment,
  dentists,
}: AgendaToolbarProps) {
  const { selectedDentistId } = useDentistFilter();
  const selectedDentist = dentists.find(
    (dentist) => dentist.id === selectedDentistId,
  );

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
  );
}

export type { AgendaViewMode };
