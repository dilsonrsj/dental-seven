import { isValidFdiTooth } from "./fdi";
import { isToothStatus } from "./tooth-status";

export const MAX_TOOTH_NOTE_LENGTH = 500;

export function assertValidToothRecordInput(input: {
  toothNumber: number;
  status: string;
  note: string | null;
}): void {
  if (!isValidFdiTooth(input.toothNumber)) {
    throw new Error("Número de dente FDI inválido.");
  }
  if (!isToothStatus(input.status)) {
    throw new Error("Status clínico inválido.");
  }
  if (input.note && input.note.length > MAX_TOOTH_NOTE_LENGTH) {
    throw new Error(`A nota deve ter no máximo ${MAX_TOOTH_NOTE_LENGTH} caracteres.`);
  }
}

export function normalizeToothNote(note: string | null | undefined): string | null {
  if (!note) return null;
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : null;
}
