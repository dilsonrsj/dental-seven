"use client";

import { useState } from "react";
import { Button, Input, toast } from "@/components/ui";
import {
  DAY_LABELS,
  type DaySchedule,
} from "./operating-hours";

type OperatingHoursFormProps = {
  initialSchedule: DaySchedule[];
  canWrite: boolean;
  onSave: (schedules: DaySchedule[]) => Promise<void>;
  description?: string;
};

export function OperatingHoursForm({
  initialSchedule,
  canWrite,
  onSave,
  description,
}: OperatingHoursFormProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>(initialSchedule);
  const [isSaving, setIsSaving] = useState(false);

  function updateDay(dayOfWeek: number, patch: Partial<DaySchedule>) {
    setSchedules((current) =>
      current.map((entry) =>
        entry.dayOfWeek === dayOfWeek ? { ...entry, ...patch } : entry,
      ),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) return;

    try {
      setIsSaving(true);
      await onSave(schedules);
      toast.success("Horários salvos.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="space-y-2">
        {schedules.map((entry) => (
          <div
            key={entry.dayOfWeek}
            className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[72px_1fr_1fr_1fr]"
          >
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={entry.isOpen}
                onChange={(event) =>
                  updateDay(entry.dayOfWeek, {
                    isOpen: event.target.checked,
                    opensAt: event.target.checked ? "08:00" : null,
                    closesAt: event.target.checked ? "18:00" : null,
                  })
                }
                disabled={!canWrite || isSaving}
              />
              {DAY_LABELS[entry.dayOfWeek]}
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Início</span>
              <Input
                type="time"
                value={entry.opensAt ?? ""}
                onChange={(event) =>
                  updateDay(entry.dayOfWeek, { opensAt: event.target.value })
                }
                disabled={!canWrite || !entry.isOpen || isSaving}
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Fim</span>
              <Input
                type="time"
                value={entry.closesAt ?? ""}
                onChange={(event) =>
                  updateDay(entry.dayOfWeek, { closesAt: event.target.value })
                }
                disabled={!canWrite || !entry.isOpen || isSaving}
              />
            </label>

            <div className="flex items-end">
              <span className="text-xs text-muted-foreground">
                {entry.isOpen ? "Aberto" : "Fechado"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {canWrite && (
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar horários"}
        </Button>
      )}
    </form>
  );
}
