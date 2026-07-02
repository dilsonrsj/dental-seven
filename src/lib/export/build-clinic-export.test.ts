import { describe, expect, it } from "vitest";
import { documentZipPath } from "./build-clinic-export";
import { toCsv } from "./csv";

describe("documentZipPath", () => {
  it("builds stable path under documents/", () => {
    expect(
      documentZipPath(
        "doc-1",
        "clinic/patient/doc-1/laudo.pdf",
      ),
    ).toBe("documents/doc-1_laudo.pdf");
  });
});

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
