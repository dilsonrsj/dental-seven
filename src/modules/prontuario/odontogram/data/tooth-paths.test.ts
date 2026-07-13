import { describe, expect, it } from "vitest";
import { dentalData } from "./dental-data";
import { buildToothLayouts, labelPosition, toothTransform } from "./arch-layout";
import { CHART_SYMBOLS, symbolHref, symbolIdForTooth } from "./chart-symbols";

describe("buildToothLayouts", () => {
  it("positions 32 teeth on upper and lower arches", () => {
    const groups = new Map(dentalData.map((t) => [t.id, t.group]));
    const layouts = buildToothLayouts(groups);
    expect(layouts).toHaveLength(32);

    const incisor11 = layouts.find((l) => l.id === 11)!;
    const molar18 = layouts.find((l) => l.id === 18)!;
    expect(incisor11.y).toBeGreaterThan(molar18.y);
    expect(toothTransform(incisor11)).toMatch(/^translate\(/);
    expect(labelPosition(incisor11).y).toBeGreaterThan(incisor11.y + 30);
  });
});

describe("chart symbols", () => {
  it("exposes 6 schematic symbols for use tags", () => {
    expect(Object.keys(CHART_SYMBOLS)).toHaveLength(6);
    expect(symbolIdForTooth(true, 3)).toBe("tooth-upper-3");
    expect(symbolHref(false, 1)).toBe("#tooth-lower-1");
  });
});
