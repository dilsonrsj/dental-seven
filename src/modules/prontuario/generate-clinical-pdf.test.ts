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
  clinicContact: {
    whatsapp: "(11) 98765-4321",
    instagram: "@clinica.smoketest",
    email: "contato@clinica-smoketest.com.br",
    address: "Av. Paulista, 1000 — São Paulo/SP",
  },
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
    cidPatientAuthorized: false,
    cid: null,
  },
  {
    ...baseContext,
    template: "guia",
    exams: "Radiografia panorâmica e tomografia do setor 36.",
  },
];

describe("buildClinicalPdf", () => {
  it.each(fixtures)(
    "gera PDF não vazio para $template",
    async (payload) => {
      const bytes = await buildClinicalPdf(payload);

      expect(bytes.length).toBeGreaterThan(500);
      expect(Buffer.from(bytes.subarray(0, 4)).toString("ascii")).toBe("%PDF");
    },
    15_000,
  );

  it("define metadados do PDF para atestado", async () => {
    const bytes = await buildClinicalPdf({
      ...baseContext,
      template: "atestado",
      daysOff: 1,
      cidPatientAuthorized: false,
      cid: null,
    });

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getTitle()).toBe("Atestado Médico");
    expect(pdf.getAuthor()).toBe("Dra. Smoke Test");
    expect(pdf.getSubject()).toBe("Atestado odontológico");
    expect(pdf.getCreator()).toBe("Dental Seven");
    expect(pdf.getKeywords()).toContain("atestado");
    expect(pdf.getKeywords()).toContain("Marina Smoke");
  }, 15_000);

  it("gera receita com medicamentos longos sem lançar erro", async () => {
    const bytes = await buildClinicalPdf({
      ...baseContext,
      template: "receita",
      medications:
        "Amoxicilina 500mg de 8 em 8 horas por 7 dias. Enxaguante bucal sem álcool após as refeições. Retorno em 15 dias para reavaliação clínica.",
    });

    expect(bytes.byteLength).toBeGreaterThan(800);
  }, 15_000);

  it("gera PDF com logo da clínica embutida", async () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const bytes = await buildClinicalPdf({
      ...baseContext,
      template: "receita",
      medications: "Dipirona 500mg se dor.",
      clinicLogoImageBytes: png,
    });

    expect(bytes.byteLength).toBeGreaterThan(800);
  }, 15_000);
});
