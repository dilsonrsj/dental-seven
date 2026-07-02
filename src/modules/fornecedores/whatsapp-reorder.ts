export function normalizePhoneForWhatsApp(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

export function buildReorderMessage(input: {
  supplyName: string;
  quantityOnHand: number;
  unitLabel: string;
  minQuantity: number | null;
}): string {
  const min = input.minQuantity ?? 0;
  return `Olá! Preciso repor o insumo ${input.supplyName}. Saldo atual: ${input.quantityOnHand} ${input.unitLabel}. Mínimo: ${min}.`;
}

export function buildReorderWhatsAppUrl(input: {
  phone: string;
  supplyName: string;
  quantityOnHand: number;
  unitLabel: string;
  minQuantity: number | null;
}): string | null {
  const normalized = normalizePhoneForWhatsApp(input.phone);
  if (!normalized) return null;
  const text = encodeURIComponent(buildReorderMessage(input));
  return `https://wa.me/${normalized}?text=${text}`;
}
