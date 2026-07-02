import type { StockAlertLevel, StockLevelInput } from "./types";

export type { StockAlertLevel, StockLevelInput };

export function getStockAlertLevel(supply: StockLevelInput): StockAlertLevel {
  if (supply.quantity_on_hand < 0) return "critical";
  if (
    supply.min_quantity != null &&
    supply.quantity_on_hand < supply.min_quantity
  ) {
    return "low";
  }
  return "ok";
}

export function isStockAlert(level: StockAlertLevel): boolean {
  return level === "low" || level === "critical";
}
