export const UPPER_ARCH_LEFT = [18, 17, 16, 15, 14, 13, 12, 11] as const;
export const UPPER_ARCH_RIGHT = [21, 22, 23, 24, 25, 26, 27, 28] as const;
export const LOWER_ARCH_LEFT = [48, 47, 46, 45, 44, 43, 42, 41] as const;
export const LOWER_ARCH_RIGHT = [31, 32, 33, 34, 35, 36, 37, 38] as const;

export const PERMANENT_FDI_TEETH = [
  ...UPPER_ARCH_LEFT,
  ...UPPER_ARCH_RIGHT,
  ...LOWER_ARCH_LEFT,
  ...LOWER_ARCH_RIGHT,
] as const;

const PERMANENT_FDI_SET = new Set<number>(PERMANENT_FDI_TEETH);

export function isValidFdiTooth(toothNumber: number): boolean {
  return PERMANENT_FDI_SET.has(toothNumber);
}

export function getToothLabel(toothNumber: number): string {
  const labels: Record<number, string> = {
    11: "Incisivo central superior direito",
    16: "1º molar superior direito",
    26: "1º molar superior esquerdo",
    36: "1º molar inferior esquerdo",
    46: "1º molar inferior direito",
  };
  return labels[toothNumber] ?? `Dente ${toothNumber}`;
}
