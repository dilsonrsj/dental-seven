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
      expect(payload.cidPatientAuthorized).toBe(false);
      expect(payload.cid).toBeNull();
    }
  });

  it("rejeita autorização de CID sem código selecionado", () => {
    expect(() =>
      validateClinicalDocumentInput({
        template: "atestado",
        daysOff: 1,
        cidPatientAuthorized: true,
      }),
    ).toThrow(/selecione o cid/i);
  });

  it("monta payload com CID quando autorizado", () => {
    const payload = toClinicalPdfPayload(
      {
        template: "atestado",
        daysOff: 3,
        cidPatientAuthorized: true,
        cidCode: "K04.0",
      },
      { clinicName: "C", patientName: "Ana", dentistName: "Dr." },
    );

    expect(payload.template).toBe("atestado");
    if (payload.template === "atestado") {
      expect(payload.cidPatientAuthorized).toBe(true);
      expect(payload.cid).toEqual({ code: "K04.0", label: "Pulpite" });
    }
  });

  it("ignora CID quando autorização não marcada", () => {
    const payload = toClinicalPdfPayload(
      {
        template: "atestado",
        daysOff: 1,
        cidPatientAuthorized: false,
        cidCode: "K04.0",
      },
      { clinicName: "C", patientName: "Ana", dentistName: "Dr." },
    );

    if (payload.template === "atestado") {
      expect(payload.cidPatientAuthorized).toBe(false);
      expect(payload.cid).toBeNull();
    }
  });

  it("gera título padrão por template", () => {
    expect(
      buildDocumentTitle({ template: "guia", exams: "RX" }, "João"),
    ).toBe("Guia de exame — João");
  });
});
