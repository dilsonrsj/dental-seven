import { describe, expect, it } from "vitest";
import { brlInputToCents, centsToBrlInput, formatBrlFromCents } from "./price-utils";

describe("price-utils", () => {
  it("converte BRL input para centavos", () => {
    expect(brlInputToCents("149,90")).toBe(14990);
    expect(brlInputToCents("0")).toBe(0);
  });

  it("converte centavos para input BRL", () => {
    expect(centsToBrlInput(14990)).toBe("149,90");
  });

  it("formata exibição", () => {
    expect(formatBrlFromCents(14990)).toMatch(/149/);
  });
});
