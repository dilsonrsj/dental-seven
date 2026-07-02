import { describe, expect, it } from "vitest";
import { computeMonthSummary } from "./month-summary";

describe("computeMonthSummary", () => {
  it("calcula margem do mês", () => {
    const result = computeMonthSummary({
      entries: [
        { entry_type: "revenue", amount_cents: 20000 },
        { entry_type: "variable_cost", amount_cents: -5000 },
        { entry_type: "manual_expense", amount_cents: -1000 },
      ],
      fixedCostsCents: 8000,
    });
    expect(result.revenueCents).toBe(20000);
    expect(result.variableCostCents).toBe(6000);
    expect(result.fixedCostsCents).toBe(8000);
    expect(result.marginCents).toBe(6000);
  });

  it("inclui estornos na receita", () => {
    const result = computeMonthSummary({
      entries: [
        { entry_type: "revenue", amount_cents: 15000 },
        { entry_type: "revenue_reversal", amount_cents: -15000 },
      ],
      fixedCostsCents: 0,
    });
    expect(result.revenueCents).toBe(0);
  });
});
