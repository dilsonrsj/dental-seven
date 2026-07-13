import { describe, expect, it } from "vitest";
import {
  PLAN_MODULES,
  defaultModuleEnabled,
  isModuleEnabledForPlan,
} from "./plans";

describe("PLAN_MODULES repositioned", () => {
  it("conecta inclui prontuario e procedimentos, sem whatsapp", () => {
    expect(PLAN_MODULES.conecta).toEqual(
      expect.arrayContaining(["prontuario", "procedimentos"]),
    );
    expect(PLAN_MODULES.conecta).not.toContain("whatsapp");
  });

  it("inteligente inclui estoque e financeiro, sem whatsapp nem ai", () => {
    expect(PLAN_MODULES.inteligente).toEqual(
      expect.arrayContaining(["estoque", "financeiro"]),
    );
    expect(PLAN_MODULES.inteligente).not.toContain("whatsapp");
    expect(PLAN_MODULES.inteligente).not.toContain("ai_agent");
  });

  it("completo inclui whatsapp, ai_agent e fornecedores", () => {
    expect(PLAN_MODULES.completo).toEqual(
      expect.arrayContaining(["whatsapp", "ai_agent", "fornecedores"]),
    );
  });

  it("convenios só em inteligente e completo", () => {
    expect(isModuleEnabledForPlan("essencial", "convenios")).toBe(false);
    expect(isModuleEnabledForPlan("conecta", "convenios")).toBe(false);
    expect(isModuleEnabledForPlan("inteligente", "convenios")).toBe(true);
    expect(isModuleEnabledForPlan("completo", "convenios")).toBe(true);
    expect(defaultModuleEnabled("inteligente", "convenios")).toBe(true);
  });
});

describe("defaultModuleEnabled", () => {
  it("liga modulos clinicos no conecta", () => {
    expect(defaultModuleEnabled("conecta", "prontuario")).toBe(true);
    expect(defaultModuleEnabled("conecta", "procedimentos")).toBe(true);
    expect(defaultModuleEnabled("conecta", "whatsapp")).toBe(false);
  });

  it("liga whatsapp no completo mas nao ai_agent", () => {
    expect(defaultModuleEnabled("completo", "whatsapp")).toBe(true);
    expect(defaultModuleEnabled("completo", "ai_agent")).toBe(false);
  });

  it("isModuleEnabledForPlan reflete PLAN_MODULES", () => {
    expect(isModuleEnabledForPlan("essencial", "prontuario")).toBe(false);
    expect(isModuleEnabledForPlan("completo", "fornecedores")).toBe(true);
  });
});
