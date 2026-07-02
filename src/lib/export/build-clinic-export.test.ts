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

  it("formats clinical note rows for export", () => {
    const csv = toCsv(
      [
        {
          id: "note-1",
          patient_id: "patient-1",
          appointment_id: null,
          author_id: "author-1",
          body: "Evolução clínica",
          created_at: "2026-07-02T12:00:00.000Z",
        },
      ],
      [
        "id",
        "patient_id",
        "appointment_id",
        "author_id",
        "body",
        "created_at",
      ],
    );
    expect(csv).toContain("note-1");
    expect(csv).toContain("Evolução clínica");
  });
});
