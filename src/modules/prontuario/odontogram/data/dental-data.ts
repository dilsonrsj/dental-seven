import { PERMANENT_FDI_TEETH } from "../data/fdi";

export type ToothGroup =
  | "incisor"
  | "canine"
  | "premolar"
  | "first_molar"
  | "second_molar"
  | "third_molar";

export type DentalToothData = {
  id: number;
  quadrant: 1 | 2 | 3 | 4;
  group: ToothGroup;
  name: string;
  roots: number;
};

const TOOTH_NAMES: Record<number, string> = {
  11: "Incisivo Central Superior Direito",
  12: "Incisivo Lateral Superior Direito",
  13: "Canino Superior Direito",
  14: "1º Pré-molar Superior Direito",
  15: "2º Pré-molar Superior Direito",
  16: "1º Molar Superior Direito",
  17: "2º Molar Superior Direito",
  18: "3º Molar Superior Direito",
  21: "Incisivo Central Superior Esquerdo",
  22: "Incisivo Lateral Superior Esquerdo",
  23: "Canino Superior Esquerdo",
  24: "1º Pré-molar Superior Esquerdo",
  25: "2º Pré-molar Superior Esquerdo",
  26: "1º Molar Superior Esquerdo",
  27: "2º Molar Superior Esquerdo",
  28: "3º Molar Superior Esquerdo",
  31: "Incisivo Central Inferior Esquerdo",
  32: "Incisivo Lateral Inferior Esquerdo",
  33: "Canino Inferior Esquerdo",
  34: "1º Pré-molar Inferior Esquerdo",
  35: "2º Pré-molar Inferior Esquerdo",
  36: "1º Molar Inferior Esquerdo",
  37: "2º Molar Inferior Esquerdo",
  38: "3º Molar Inferior Esquerdo",
  41: "Incisivo Central Inferior Direito",
  42: "Incisivo Lateral Inferior Direito",
  43: "Canino Inferior Direito",
  44: "1º Pré-molar Inferior Direito",
  45: "2º Pré-molar Inferior Direito",
  46: "1º Molar Inferior Direito",
  47: "2º Molar Inferior Direito",
  48: "3º Molar Inferior Direito",
};

function getQuadrant(id: number): 1 | 2 | 3 | 4 {
  return Math.floor(id / 10) as 1 | 2 | 3 | 4;
}

function getToothGroup(id: number): ToothGroup {
  const digit = id % 10;
  if (digit <= 2) return "incisor";
  if (digit === 3) return "canine";
  if (digit <= 5) return "premolar";
  if (digit === 6) return "first_molar";
  if (digit === 7) return "second_molar";
  return "third_molar";
}

function getRootCount(id: number): number {
  const digit = id % 10;
  const quadrant = getQuadrant(id);
  if (digit <= 3) return 1;
  if (digit <= 5) return 2;
  if (quadrant === 1 || quadrant === 2) return 3;
  return 2;
}

export const dentalData: DentalToothData[] = PERMANENT_FDI_TEETH.map((id) => ({
  id,
  quadrant: getQuadrant(id),
  group: getToothGroup(id),
  name: TOOTH_NAMES[id],
  roots: getRootCount(id),
}));

export function getDentalToothById(id: number): DentalToothData | undefined {
  return dentalData.find((tooth) => tooth.id === id);
}
