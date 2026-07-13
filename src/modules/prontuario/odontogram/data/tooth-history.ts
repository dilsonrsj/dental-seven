import type { PatientClinicalNoteListItem } from "../../types";
import type { PatientToothRecordListItem } from "../../types";

export type ToothHistoryEntry = {
  id: string;
  occurredAt: string;
  authorName: string | null;
  summary: string;
  source: "tooth_record" | "clinical_note";
};

export function noteMentionsTooth(body: string, toothNumber: number): boolean {
  const pattern = new RegExp(`\\b${toothNumber}\\b`);
  return pattern.test(body);
}

export function buildToothHistory(
  toothNumber: number,
  toothRecord: PatientToothRecordListItem | null,
  clinicalNotes: PatientClinicalNoteListItem[],
): ToothHistoryEntry[] {
  const entries: ToothHistoryEntry[] = [];

  if (toothRecord && toothRecord.updated_at) {
    const parts = [TOOTH_STATUS_LABELS[toothRecord.status] ?? toothRecord.status];
    if (toothRecord.note) parts.push(toothRecord.note);
    entries.push({
      id: `record-${toothRecord.id}`,
      occurredAt: toothRecord.updated_at,
      authorName: null,
      summary: parts.join(" — "),
      source: "tooth_record",
    });
  }

  for (const note of clinicalNotes) {
    if (!noteMentionsTooth(note.body, toothNumber)) continue;
    entries.push({
      id: `note-${note.id}`,
      occurredAt: note.created_at,
      authorName: note.author_name,
      summary: note.body.trim(),
      source: "clinical_note",
    });
  }

  return entries.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

const TOOTH_STATUS_LABELS: Record<string, string> = {
  healthy: "Saudável",
  caries: "Cárie",
  restored: "Restaurado",
  missing: "Ausente",
  implant: "Implante",
  crown: "Coroa",
  root_canal: "Endodontia",
  fracture: "Fratura",
  other: "Outro",
};
