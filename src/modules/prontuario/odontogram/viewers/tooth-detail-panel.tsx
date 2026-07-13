"use client";

import { useEffect, useState } from "react";
import { Button, toast } from "@/components/ui";
import type { PatientToothRecordListItem } from "../../types";
import { getToothLabel } from "../data/fdi";
import {
  TOOTH_STATUS_OPTIONS,
  isToothStatus,
  type ToothStatus,
} from "../data/tooth-status";
import type { ToothHistoryEntry } from "../data/tooth-history";
import {
  clearPatientToothRecord,
  upsertPatientToothRecord,
} from "../actions/tooth-actions";

type ToothDetailPanelProps = {
  patientId: string;
  toothNumber: number;
  history: ToothHistoryEntry[];
  initialStatus: ToothStatus;
  initialNote: string;
  canWrite: boolean;
  onClose: () => void;
  onSaved: (record: PatientToothRecordListItem) => void;
  onCleared: (toothNumber: number) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ToothDetailPanel({
  patientId,
  toothNumber,
  history,
  initialStatus,
  initialNote,
  canWrite,
  onClose,
  onSaved,
  onCleared,
}: ToothDetailPanelProps) {
  const [status, setStatus] = useState<ToothStatus>(initialStatus);
  const [note, setNote] = useState(initialNote);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
    setNote(initialNote);
  }, [initialStatus, initialNote, toothNumber]);

  async function handleSave() {
    if (!canWrite) return;
    try {
      setIsSaving(true);
      const record = await upsertPatientToothRecord(patientId, toothNumber, {
        status,
        note,
      });
      toast.success("Dente atualizado.");
      onSaved(record);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    if (!canWrite) return;
    try {
      setIsSaving(true);
      await clearPatientToothRecord(patientId, toothNumber);
      toast.success("Dente restaurado.");
      onCleared(toothNumber);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao limpar.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-lg">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">Dente {toothNumber}</h3>
          <p className="text-sm text-primary">
            {history.length} atendimento{history.length === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">{getToothLabel(toothNumber)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Fechar painel"
        >
          ✕
        </button>
      </div>

      <div className="mb-4 max-h-48 space-y-3 overflow-y-auto border-t border-border pt-3">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro para este dente.</p>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="text-sm">
              <p className="text-muted-foreground">{formatDate(entry.occurredAt)}</p>
              {entry.authorName && (
                <p className="font-medium">{entry.authorName}</p>
              )}
              <p className="text-foreground/90">{entry.summary}</p>
            </div>
          ))
        )}
      </div>

      {canWrite && (
        <div className="space-y-3 border-t border-border pt-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value;
                if (isToothStatus(v)) setStatus(v);
              }}
              disabled={isSaving}
              className="flex h-10 w-full rounded-xl border border-border bg-input px-3 text-sm"
            >
              {TOOTH_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Nota</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={isSaving}
              className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm"
              placeholder="Observações…"
            />
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => void handleClear()} disabled={isSaving}>
              Limpar
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
