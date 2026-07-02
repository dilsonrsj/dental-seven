import { assertBomQuantity } from "@/modules/procedimentos/validation";
import type { StockMovementType } from "./types";

export function assertMovementQuantity(value: number): number {
  return assertBomQuantity(value);
}

export function assertMinQuantity(value: number | null): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Estoque mínimo deve ser zero ou maior.");
  }
  return Math.round(value * 1000) / 1000;
}

export function assertAdjustmentDelta(value: number): number {
  if (!Number.isFinite(value) || value === 0) {
    throw new Error("Quantidade deve ser diferente de zero.");
  }
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - value) > 0.0001) {
    throw new Error("Quantidade aceita no máximo 3 casas decimais.");
  }
  return rounded;
}

export function movementQuantityForType(
  type: Exclude<
    StockMovementType,
    "adjustment" | "auto_deduction" | "auto_reversal"
  >,
  absoluteQuantity: number,
): number {
  const qty = assertMovementQuantity(absoluteQuantity);
  return type === "inbound" ? qty : -qty;
}
