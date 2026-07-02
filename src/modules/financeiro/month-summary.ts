import type { FinancialEntryType, MonthSummary, SummaryEntry } from "./types";

export type { SummaryEntry, MonthSummary };

const REVENUE_TYPES: FinancialEntryType[] = [
  "revenue",
  "revenue_reversal",
  "manual_revenue",
];

const VARIABLE_COST_TYPES: FinancialEntryType[] = [
  "variable_cost",
  "variable_cost_reversal",
  "manual_expense",
];

export function computeMonthSummary(input: {
  entries: SummaryEntry[];
  fixedCostsCents: number;
}): MonthSummary {
  const revenueCents = input.entries
    .filter((e) => REVENUE_TYPES.includes(e.entry_type))
    .reduce((sum, e) => sum + e.amount_cents, 0);

  const variableCostCents = Math.abs(
    input.entries
      .filter((e) => VARIABLE_COST_TYPES.includes(e.entry_type))
      .reduce((sum, e) => sum + e.amount_cents, 0),
  );

  const fixedCostsCents = input.fixedCostsCents;
  const marginCents = revenueCents - variableCostCents - fixedCostsCents;

  return { revenueCents, variableCostCents, fixedCostsCents, marginCents };
}
