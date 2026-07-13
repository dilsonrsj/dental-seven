import { describe, expect, it } from "vitest";
import { assertValidToothRecordInput } from "./tooth-record-input";

describe("assertValidToothRecordInput", () => {
  it("accepts valid input", () => {
    expect(() =>
      assertValidToothRecordInput({
        toothNumber: 16,
        status: "caries",
        note: "Lesão oclusal",
      }),
    ).not.toThrow();
  });

  it("rejects invalid tooth", () => {
    expect(() =>
      assertValidToothRecordInput({
        toothNumber: 99,
        status: "healthy",
        note: null,
      }),
    ).toThrow(/FDI/i);
  });
});
