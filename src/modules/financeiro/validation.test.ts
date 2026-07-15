import { describe, expect, it } from "vitest";
import {
  assertAmountCents,
  assertYearMonth,
  toExpenseAmountCents,
} from "./validation";

describe("validation", () => {
  it("rejeita valor zero", () => {
    expect(() => assertAmountCents(0)).toThrow();
  });

  it("aceita year_month válido", () => {
    expect(assertYearMonth("2026-07")).toBe("2026-07");
  });

  it("converte despesa manual para negativo", () => {
    expect(toExpenseAmountCents(1000)).toBe(-1000);
  });
});
