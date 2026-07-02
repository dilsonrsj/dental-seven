import { describe, expect, it } from "vitest";
import { getStockAlertLevel, isStockAlert } from "./stock-level";

describe("getStockAlertLevel", () => {
  it("crítico quando saldo negativo", () => {
    expect(
      getStockAlertLevel({ quantity_on_hand: -1, min_quantity: 5 }),
    ).toBe("critical");
  });

  it("baixo quando abaixo do mínimo", () => {
    expect(
      getStockAlertLevel({ quantity_on_hand: 2, min_quantity: 5 }),
    ).toBe("low");
  });

  it("ok quando acima do mínimo", () => {
    expect(
      getStockAlertLevel({ quantity_on_hand: 10, min_quantity: 5 }),
    ).toBe("ok");
  });

  it("ok sem mínimo definido e saldo positivo", () => {
    expect(
      getStockAlertLevel({ quantity_on_hand: 0, min_quantity: null }),
    ).toBe("ok");
  });
});

describe("isStockAlert", () => {
  it("true para low e critical", () => {
    expect(isStockAlert("low")).toBe(true);
    expect(isStockAlert("critical")).toBe(true);
    expect(isStockAlert("ok")).toBe(false);
  });
});
