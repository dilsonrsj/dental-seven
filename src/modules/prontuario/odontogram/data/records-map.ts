import type { PatientClinicalNoteListItem } from "../../types";
import type { PatientToothRecordListItem } from "../../types";
import { dentalData } from "./dental-data";
import { noteMentionsTooth } from "./tooth-history";
import { isToothStatus, type ToothStatus } from "./tooth-status";

export function mapRecordsToStatus(
  records: { tooth_number: number; status: string }[],
): Map<number, ToothStatus> {
  const map = new Map<number, ToothStatus>();
  for (const record of records) {
    if (isToothStatus(record.status)) {
      map.set(record.tooth_number, record.status);
    }
  }
  return map;
}

export function buildTeethWithHistory(
  records: PatientToothRecordListItem[],
  clinicalNotes: PatientClinicalNoteListItem[],
): Set<number> {
  const teeth = new Set<number>();

  for (const record of records) {
    teeth.add(record.tooth_number);
  }

  for (const note of clinicalNotes) {
    for (const tooth of dentalData) {
      if (noteMentionsTooth(note.body, tooth.id)) {
        teeth.add(tooth.id);
      }
    }
  }

  return teeth;
}
