import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildClinicalPdf } from "./generate-clinical-pdf";
import type { ClinicalPdfPayload } from "./templates/types";

const baseContext = {
  clinicName: "Clínica Smoke Test",
  patientName: "Marina Smoke",
  dentistName: "Dra. Smoke Test",
  dentistCro: "CRO-SP 12345",
  dentistSpecialty: "Clínico Geral",
  issuedAt: new Date("2026-07-02T12:00:00.000Z"),
};

const fixtures: ClinicalPdfPayload[] = [
  {
    ...baseContext,
    template: "receita",
    medications: "Ibuprofeno 600mg — 1 comprimido a cada 8h por 3 dias.",
  },
  {
    ...baseContext,
    template: "atestado",
    daysOff: 2,
    reason: "Procedimento odontológico",
  },
  {
    ...baseContext,
    template: "guia",
    exams: "Radiografia panorâmica e tomografia do setor 36.",
  },
];

describe("buildClinicalPdf", () => {
  it.each(fixtures)("gera PDF não vazio para $template", async (payload) => {
    const bytes = await buildClinicalPdf(payload);

    expect(bytes.length).toBeGreaterThan(500);
    expect(Buffer.from(bytes.subarray(0, 4)).toString("ascii")).toBe("%PDF");
  });

  it("define metadados do PDF para atestado", async () => {
    const bytes = await buildClinicalPdf({
      ...baseContext,
      template: "atestado",
      daysOff: 1,
    });

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("Atestado Médico");
    expect(pdf.getAuthor()).toBe("Dra. Smoke Test");
    expect(pdf.getSubject()).toBe("Atestado odontológico");
    expect(pdf.getCreator()).toBe("Dental Seven");
    expect(pdf.getKeywords()).toContain("atestado");
    expect(pdf.getKeywords()).toContain("Marina Smoke");
  });

  it("gera receita com medicamentos longos sem lançar erro", async () => {
    const bytes = await buildClinicalPdf({
      ...baseContext,
      template: "receita",
      medications:
        "Amoxicilina 500mg de 8 em 8 horas por 7 dias. Enxaguante bucal sem álcool após as refeições. Retorno em 15 dias para reavaliação clínica.",
    });

    expect(bytes.byteLength).toBeGreaterThan(800);
  });
});
