"use client";

import {
  useDentistFilter,
  type SelectedDentistId,
} from "@/contexts/dentist-filter-context";
import { DemoLogoutButton } from "./demo-logout-button";

const DENTIST_OPTIONS: { id: SelectedDentistId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "22222222-2222-2222-2222-222222222201", label: "Ana" },
  { id: "22222222-2222-2222-2222-222222222202", label: "Carlos" },
];

export function AppHeader() {
  const { selectedDentistId, setSelectedDentistId } = useDentistFilter();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
      <h1 className="truncate font-display text-lg font-semibold tracking-tight">
        Clínica Sorriso Norte
      </h1>
      <div className="flex shrink-0 items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="sr-only">Filtrar por dentista</span>
          <select
            value={selectedDentistId}
            onChange={(event) =>
              setSelectedDentistId(event.target.value as SelectedDentistId)
            }
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {DENTIST_OPTIONS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <DemoLogoutButton compact className="h-10 w-10 px-0 sm:w-auto sm:px-4" />
      </div>
    </header>
  );
}
