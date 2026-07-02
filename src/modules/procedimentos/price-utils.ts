export function brlInputToCents(input: string): number {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Valor em reais inválido.");
  }
  return Math.round(value * 100);
}

export function centsToBrlInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatBrlFromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
