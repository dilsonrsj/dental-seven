import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = toCsv(
      [{ id: "1", name: 'João, "Silva"', notes: "linha\n2" }],
      ["id", "name", "notes"],
    );
    expect(csv).toContain('"João, ""Silva"""');
    expect(csv).toContain('"linha\n2"');
  });

  it("handles empty rows", () => {
    expect(toCsv([], ["id", "name"])).toBe("id,name");
  });
});
