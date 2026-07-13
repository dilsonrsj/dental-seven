import { describe, expect, it } from "vitest";
import { dentalData, getDentalToothById } from "./dental-data";

describe("dentalData", () => {
  it("lists 32 permanent teeth in FDI notation", () => {
    expect(dentalData).toHaveLength(32);
    expect(dentalData.map((t) => t.id)).toContain(11);
    expect(dentalData.map((t) => t.id)).toContain(48);
  });

  it("assigns quadrant, group and roots", () => {
    const molar = getDentalToothById(16);
    expect(molar?.quadrant).toBe(1);
    expect(molar?.group).toBe("first_molar");
    expect(molar?.roots).toBe(3);

    const incisor = getDentalToothById(31);
    expect(incisor?.quadrant).toBe(3);
    expect(incisor?.group).toBe("incisor");
    expect(incisor?.roots).toBe(1);
  });
});
