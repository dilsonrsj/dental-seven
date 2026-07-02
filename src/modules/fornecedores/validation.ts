import { assertCatalogName } from "@/modules/procedimentos/validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertSupplierName(value: string): string {
  return assertCatalogName(value);
}

export function assertSupplierPhone(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\D/g, "") || null;
}

export function assertSupplierEmail(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw new Error("E-mail inválido.");
  }
  return trimmed;
}
