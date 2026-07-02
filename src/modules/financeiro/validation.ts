const MIN_DESCRIPTION_LENGTH = 2;
const MAX_DESCRIPTION_LENGTH = 200;

const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function assertAmountCents(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Valor deve ser um inteiro positivo maior que zero.");
  }
  return value;
}

export function assertEntryDescription(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    throw new Error("Descrição deve ter no mínimo 2 caracteres.");
  }
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error("Descrição deve ter no máximo 200 caracteres.");
  }
  return trimmed;
}

export function assertYearMonth(value: string): string {
  const trimmed = value.trim();
  if (!YEAR_MONTH_PATTERN.test(trimmed)) {
    throw new Error("Mês inválido. Use o formato AAAA-MM.");
  }
  const month = Number(trimmed.slice(5, 7));
  if (month < 1 || month > 12) {
    throw new Error("Mês inválido. Use o formato AAAA-MM.");
  }
  return trimmed;
}

export function toExpenseAmountCents(value: number): number {
  return -assertAmountCents(value);
}
