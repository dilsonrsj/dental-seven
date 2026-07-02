import { describe, expect, it } from "vitest";
import {
  buildDocumentTitle,
  toClinicalPdfPayload,
  validateClinicalDocumentInput,
} from "./clinical-document-input";

describe("clinical-document-input", () => {
  it("valida campos obrigatórios da receita", () => {
    expect(() =>
      validateClinicalDocumentInput({ template: "receita", medications: "  " }),
    ).toThrow(/prescrição/i);
  });

  it("monta payload de atestado com dias de afastamento", () => {
    const payload = toClinicalPdfPayload(
      { template: "atestado", daysOff: 2, reason: "Cirurgia" },
      {
        clinicName: "Clínica",
        patientName: "Marina",
        dentistName: "Dra.",
      },
    );

    expect(payload.template).toBe("atestado");
    if (payload.template === "atestado") {
      expect(payload.daysOff).toBe(2);
      expect(payload.reason).toBe("Cirurgia");
    }
  });

  it("gera título padrão por template", () => {
    expect(
      buildDocumentTitle({ template: "guia", exams: "RX" }, "João"),
    ).toBe("Guia de exame — João");
  });
});
