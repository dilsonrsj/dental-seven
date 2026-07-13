import { describe, expect, it } from "vitest";
import {
  assertCardNumber,
  assertCarrierName,
  assertClaimAmount,
  assertPlanName,
  normalizeOptionalText,
} from "./validation";

describe("convenios validation", () => {
  it("rejeita nome de operadora curto", () => {
    expect(() => assertCarrierName("X")).toThrow();
    expect(assertCarrierName("  Odontoprev ")).toBe("Odontoprev");
  });

  it("rejeita nome de plano curto", () => {
    expect(() => assertPlanName("")).toThrow();
    expect(assertPlanName("Pleno")).toBe("Pleno");
  });

  it("exige carteirinha", () => {
    expect(() => assertCardNumber("")).toThrow();
    expect(assertCardNumber(" 123456 ")).toBe("123456");
  });

  it("rejeita valor negativo e arredonda", () => {
    expect(() => assertClaimAmount(-1)).toThrow();
    expect(assertClaimAmount(1050.4)).toBe(1050);
  });

  it("normaliza texto opcional", () => {
    expect(normalizeOptionalText("  ")).toBeNull();
    expect(normalizeOptionalText(null)).toBeNull();
    expect(normalizeOptionalText(" ABC ")).toBe("ABC");
  });
});
