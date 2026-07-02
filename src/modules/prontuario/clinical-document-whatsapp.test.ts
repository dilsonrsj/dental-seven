import { describe, expect, it } from "vitest";
import { buildDocumentWhatsAppMessage } from "./clinical-document-whatsapp";

describe("buildDocumentWhatsAppMessage", () => {
  it("formata mensagem simulada do documento", () => {
    expect(buildDocumentWhatsAppMessage("Atestado — Marina")).toBe(
      'Documento "Atestado — Marina" disponível na clínica.',
    );
  });
});
