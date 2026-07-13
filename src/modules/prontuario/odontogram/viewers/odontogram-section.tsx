"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PatientClinicalNoteListItem, PatientToothRecordListItem } from "../../types";
import { buildTeethWithHistory, mapRecordsToStatus } from "../data/records-map";
import { buildToothHistory } from "../data/tooth-history";
import { isToothStatus } from "../data/tooth-status";
import { DentalChart } from "./dental-chart";
import { ToothDetailPanel } from "./tooth-detail-panel";

type OdontogramSectionProps = {
  patientId: string;
  initialRecords: PatientToothRecordListItem[];
  initialNotes: PatientClinicalNoteListItem[];
  canWrite: boolean;
};

function upsertRecord(
  records: PatientToothRecordListItem[],
  record: PatientToothRecordListItem,
): PatientToothRecordListItem[] {
  const without = records.filter((item) => item.tooth_number !== record.tooth_number);
  return [...without, record];
}

export function OdontogramSection({
  patientId,
  initialRecords,
  initialNotes,
  canWrite,
}: OdontogramSectionProps) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  const recordsByTooth = useMemo(() => mapRecordsToStatus(records), [records]);

  const teethWithHistory = useMemo(
    () => buildTeethWithHistory(records, initialNotes),
    [records, initialNotes],
  );

  const selectedRecord = selectedTooth
    ? records.find((r) => r.tooth_number === selectedTooth) ?? null
    : null;

  const history = useMemo(() => {
    if (!selectedTooth) return [];
    return buildToothHistory(selectedTooth, selectedRecord, initialNotes);
  }, [selectedTooth, selectedRecord, initialNotes]);

  function handleSaved(record: PatientToothRecordListItem) {
    setRecords((prev) => upsertRecord(prev, record));
    router.refresh();
  }

  function handleCleared(toothNumber: number) {
    setRecords((prev) => prev.filter((item) => item.tooth_number !== toothNumber));
    router.refresh();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Odontograma
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Clique e explore cada dente.
        </h2>
        <p className="text-sm text-muted-foreground">
          Notação FDI. Selecione a unidade para ver histórico e status clínico.
        </p>
      </div>

      <div
        className={
          selectedTooth
            ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
            : ""
        }
      >
        <DentalChart
          recordsByTooth={recordsByTooth}
          teethWithHistory={teethWithHistory}
          selectedTooth={selectedTooth}
          onToothSelect={setSelectedTooth}
        />

        {selectedTooth && (
          <ToothDetailPanel
            key={`${selectedTooth}-${selectedRecord?.updated_at ?? "new"}`}
            patientId={patientId}
            toothNumber={selectedTooth}
            history={history}
            initialStatus={
              selectedRecord && isToothStatus(selectedRecord.status)
                ? selectedRecord.status
                : "healthy"
            }
            initialNote={selectedRecord?.note ?? ""}
            canWrite={canWrite}
            onClose={() => setSelectedTooth(null)}
            onSaved={handleSaved}
            onCleared={handleCleared}
          />
        )}
      </div>
    </section>
  );
}
