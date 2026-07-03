import { describe, expect, it } from "vitest";
import {
  FAIR_USE_CAPS,
  computeFairUsePercent,
  getFairUseCaps,
  getFairUseLevel,
} from "./usage";

describe("FAIR_USE_CAPS", () => {
  it("essencial sem caps", () => {
    expect(FAIR_USE_CAPS.essencial).toEqual({ whatsapp: null, ai: null });
  });

  it("conecta só whatsapp 1200", () => {
    expect(FAIR_USE_CAPS.conecta).toEqual({ whatsapp: 1200, ai: null });
  });

  it("inteligente whatsapp 1200 e ai 1500", () => {
    expect(FAIR_USE_CAPS.inteligente).toEqual({
      whatsapp: 1200,
      ai: 1500,
    });
  });

  it("completo whatsapp 2500 e ai 3500", () => {
    expect(FAIR_USE_CAPS.completo).toEqual({
      whatsapp: 2500,
      ai: 3500,
    });
  });
});

describe("getFairUseCaps", () => {
  it("retorna caps do plano", () => {
    expect(getFairUseCaps("conecta")).toEqual({ whatsapp: 1200, ai: null });
  });
});

describe("computeFairUsePercent", () => {
  it("retorna null quando cap é null", () => {
    expect(computeFairUsePercent(500, null)).toBeNull();
  });

  it("calcula percentual sobre o cap", () => {
    expect(computeFairUsePercent(600, 1200)).toBe(50);
    expect(computeFairUsePercent(960, 1200)).toBe(80);
    expect(computeFairUsePercent(1200, 1200)).toBe(100);
  });
});

describe("getFairUseLevel", () => {
  it("ok quando sem cap (null)", () => {
    expect(getFairUseLevel(null)).toBe("ok");
  });

  it("ok abaixo de 80%", () => {
    expect(getFairUseLevel(79.9)).toBe("ok");
    expect(getFairUseLevel(0)).toBe("ok");
  });

  it("warning entre 80% e 100%", () => {
    expect(getFairUseLevel(80)).toBe("warning");
    expect(getFairUseLevel(99.9)).toBe("warning");
  });

  it("exceeded em 100% ou mais", () => {
    expect(getFairUseLevel(100)).toBe("exceeded");
    expect(getFairUseLevel(150)).toBe("exceeded");
  });
});
