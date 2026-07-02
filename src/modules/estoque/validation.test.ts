import { describe, expect, it } from "vitest";
import {
  assertMovementQuantity,
  assertMinQuantity,
  movementQuantityForType,
} from "./validation";

describe("assertMovementQuantity", () => {
  it("rejeita zero", () => {
    expect(() => assertMovementQuantity(0)).toThrow();
  });

  it("aceita decimal", () => {
    expect(assertMovementQuantity(1.5)).toBe(1.5);
  });
});

describe("assertMinQuantity", () => {
  it("aceita null", () => {
    expect(assertMinQuantity(null)).toBe(null);
  });

  it("rejeita negativo", () => {
    expect(() => assertMinQuantity(-1)).toThrow();
  });
});

describe("movementQuantityForType", () => {
  it("inbound positivo", () => {
    expect(movementQuantityForType("inbound", 3)).toBe(3);
  });

  it("outbound negativo", () => {
    expect(movementQuantityForType("outbound", 3)).toBe(-3);
  });
});
