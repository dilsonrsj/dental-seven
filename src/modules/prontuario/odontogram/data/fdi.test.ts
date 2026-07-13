import { describe, expect, it } from "vitest";
import { PERMANENT_FDI_TEETH, isValidFdiTooth } from "./fdi";

describe("fdi", () => {
  it("has 32 permanent teeth", () => {
    expect(PERMANENT_FDI_TEETH).toHaveLength(32);
  });

  it("validates FDI numbers", () => {
    expect(isValidFdiTooth(16)).toBe(true);
    expect(isValidFdiTooth(99)).toBe(false);
  });
});
