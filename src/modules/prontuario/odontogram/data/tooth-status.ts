export const TOOTH_STATUSES = [
  "healthy",
  "caries",
  "restored",
  "missing",
  "implant",
  "crown",
  "root_canal",
  "fracture",
  "other",
] as const;

export type ToothStatus = (typeof TOOTH_STATUSES)[number];

export type ToothStatusOption = {
  value: ToothStatus;
  label: string;
};

export const TOOTH_STATUS_OPTIONS: ToothStatusOption[] = [
  { value: "healthy", label: "Saudável" },
  { value: "caries", label: "Cárie" },
  { value: "restored", label: "Restaurado" },
  { value: "missing", label: "Ausente" },
  { value: "implant", label: "Implante" },
  { value: "crown", label: "Coroa" },
  { value: "root_canal", label: "Endodontia" },
  { value: "fracture", label: "Fratura" },
  { value: "other", label: "Outro" },
];

const STATUS_SET = new Set<string>(TOOTH_STATUSES);

export function isToothStatus(value: string): value is ToothStatus {
  return STATUS_SET.has(value);
}

/** Paleta alinhada à identidade DR7: preto + azul royal #4490E2 + azul gelo #B3C9D9 */
const BRAND_TOOTH_COLORS = {
  primary: "#4490E2",
  primaryDark: "#2B6CB0",
  primaryMid: "#5A9FD4",
  primaryLight: "#7EB8F0",
  primaryGlow: "#B3C9D9",
  muted: "#A0A0A0",
  mutedDark: "#4A4A4A",
  default: "#9BA3AD",
} as const;

/** Cor hex para SVG do odontograma */
export function getToothStatusColor(status: ToothStatus, selected: boolean): string {
  if (selected) return BRAND_TOOTH_COLORS.primary;
  const map: Record<ToothStatus, string> = {
    healthy: BRAND_TOOTH_COLORS.default,
    caries: BRAND_TOOTH_COLORS.primary,
    restored: BRAND_TOOTH_COLORS.primaryGlow,
    missing: BRAND_TOOTH_COLORS.mutedDark,
    implant: BRAND_TOOTH_COLORS.primaryLight,
    crown: BRAND_TOOTH_COLORS.primaryMid,
    root_canal: BRAND_TOOTH_COLORS.primaryDark,
    fracture: BRAND_TOOTH_COLORS.primaryDark,
    other: BRAND_TOOTH_COLORS.muted,
  };
  return map[status];
}

export function toothHasClinicalStatus(status: ToothStatus): boolean {
  return status !== "healthy";
}
