import { describe, expect, it } from "vitest";
import {
  FAIR_USE_CAPS,
  buildFairUseStatus,
  computeFairUsePercent,
  getFairUseCaps,
  getFairUseLevel,
  getOverallFairUseLevel,
} from "./usage";

describe("FAIR_USE_CAPS", () => {
  it("essencial sem caps", () => {
    expect(FAIR_USE_CAPS.essencial).toEqual({ whatsapp: null, ai: null });
  });

  it("conecta sem caps de whatsapp ou ia", () => {
    expect(FAIR_USE_CAPS.conecta).toEqual({ whatsapp: null, ai: null });
  });

  it("inteligente sem caps de whatsapp ou ia", () => {
    expect(FAIR_USE_CAPS.inteligente).toEqual({ whatsapp: null, ai: null });
  });

  it("completo whatsapp 2500 e ai 3500", () => {
    expect(FAIR_USE_CAPS.completo).toEqual({
      whatsapp: 2500,
      ai: 3500,
    });
  });
});

describe("getFairUseCaps", () => {
  it("retorna caps do plano completo", () => {
    expect(getFairUseCaps("completo")).toEqual({ whatsapp: 2500, ai: 3500 });
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

describe("buildFairUseStatus", () => {
  it("monta métricas whatsapp e ai para plano completo", () => {
    const status = buildFairUseStatus("completo", {
      whatsapp_conversations: 2000,
      ai_responses: 2800,
    });

    expect(status.whatsapp.usage).toBe(2000);
    expect(status.whatsapp.cap).toBe(2500);
    expect(status.whatsapp.level).toBe("warning");
    expect(status.ai.level).toBe("warning");
  });

  it("retorna ok para plano essencial sem caps", () => {
    const status = buildFairUseStatus("essencial", {
      whatsapp_conversations: 9999,
      ai_responses: 9999,
    });

    expect(status.whatsapp.percent).toBeNull();
    expect(status.ai.percent).toBeNull();
    expect(getOverallFairUseLevel(status)).toBe("ok");
  });
});
