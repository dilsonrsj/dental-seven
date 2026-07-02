import { brlInputToCents } from "./price-utils";

const MIN_NAME_LENGTH = 2;

export function assertCatalogName(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < MIN_NAME_LENGTH) {
    throw new Error("Nome deve ter no mínimo 2 caracteres.");
  }
  return trimmed;
}

export function assertPriceCents(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Preço inválido. Use um valor em reais maior ou igual a zero.");
  }
  return value;
}

export function assertDurationMin(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Duração deve ser um número inteiro maior que zero.");
  }
  return value;
}

export function assertBomQuantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Quantidade deve ser maior que zero.");
  }
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - value) > 0.0001) {
    throw new Error("Quantidade aceita no máximo 3 casas decimais.");
  }
  return rounded;
}

export function parseOptionalCostCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const cents = brlInputToCents(trimmed);
  return assertPriceCents(cents);
}
