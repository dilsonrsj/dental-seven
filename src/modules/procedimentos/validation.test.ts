import { describe, expect, it } from "vitest";
import {
  assertBomQuantity,
  assertCatalogName,
  assertDurationMin,
  assertPriceCents,
} from "./validation";

describe("assertCatalogName", () => {
  it("aceita nome com 2+ caracteres", () => {
    expect(() => assertCatalogName("  Limpeza  ")).not.toThrow();
  });

  it("rejeita nome curto", () => {
    expect(() => assertCatalogName("A")).toThrow(/mínimo 2/i);
  });
});

describe("assertPriceCents", () => {
  it("aceita zero", () => {
    expect(assertPriceCents(0)).toBe(0);
  });

  it("rejeita negativo", () => {
    expect(() => assertPriceCents(-1)).toThrow();
  });
});

describe("assertDurationMin", () => {
  it("aceita 30", () => {
    expect(assertDurationMin(30)).toBe(30);
  });

  it("rejeita zero", () => {
    expect(() => assertDurationMin(0)).toThrow();
  });
});

describe("assertBomQuantity", () => {
  it("aceita decimal com até 3 casas", () => {
    expect(assertBomQuantity(1.25)).toBe(1.25);
  });

  it("rejeita zero", () => {
    expect(() => assertBomQuantity(0)).toThrow();
  });
});
