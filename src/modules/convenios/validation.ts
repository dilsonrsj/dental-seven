export function assertCarrierName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    throw new Error("Informe o nome da operadora (mín. 2 caracteres).");
  }
  return trimmed;
}

export function assertPlanName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    throw new Error("Informe o nome do plano (mín. 2 caracteres).");
  }
  return trimmed;
}

export function assertCardNumber(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 3) {
    throw new Error("Informe o número da carteirinha.");
  }
  return trimmed;
}

export function assertClaimAmount(cents: number): number {
  if (!Number.isFinite(cents) || cents < 0) {
    throw new Error("Valor inválido.");
  }
  return Math.round(cents);
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
