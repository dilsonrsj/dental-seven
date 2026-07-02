import { describe, expect, it } from "vitest";
import {
  assertSupplierEmail,
  assertSupplierName,
  assertSupplierPhone,
} from "./validation";

describe("validation", () => {
  it("rejeita nome curto", () => {
    expect(() => assertSupplierName("A")).toThrow();
  });

  it("aceita telefone com dígitos", () => {
    expect(assertSupplierPhone("(11) 98765-4321")).toBe("11987654321");
  });

  it("aceita e-mail vazio", () => {
    expect(assertSupplierEmail("")).toBeNull();
  });
});
