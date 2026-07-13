import { describe, expect, it } from "vitest";
import { buildToothHistory, noteMentionsTooth } from "./tooth-history";

describe("noteMentionsTooth", () => {
  it("matches FDI number as word boundary", () => {
    expect(noteMentionsTooth("Raspagem no dente 16 realizada", 16)).toBe(true);
    expect(noteMentionsTooth("Consulta geral", 16)).toBe(false);
  });
});

describe("buildToothHistory", () => {
  it("merges tooth record and matching notes", () => {
    const history = buildToothHistory(
      16,
      {
        id: "r1",
        clinic_id: "c",
        patient_id: "p",
        tooth_number: 16,
        status: "caries",
        faces: [],
        note: "Oclusal",
        updated_by: null,
        updated_at: "2026-03-25T12:00:00Z",
      },
      [
        {
          id: "n1",
          clinic_id: "c",
          patient_id: "p",
          appointment_id: null,
          author_id: null,
          body: "Raspagem dente 16",
          created_at: "2026-03-20T09:00:00Z",
          author_name: "Dr. Ricardo",
          appointment_label: null,
        },
      ],
    );
    expect(history).toHaveLength(2);
    expect(history[0].source).toBe("tooth_record");
  });
});
