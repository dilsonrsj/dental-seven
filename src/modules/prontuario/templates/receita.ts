import type { ClinicalTemplateDefinition, ReceitaPayload } from "./types";

export const receitaTemplate: ClinicalTemplateDefinition = {
  id: "receita",
  label: "Receita",
  documentTitle: "Receituário",
  pdfSubject: "Receituário odontológico",
};

export function buildReceitaLines(payload: ReceitaPayload): string[] {
  return [
    `Paciente: ${payload.patientName}`,
    "",
    "Prescrição / orientações:",
    payload.medications.trim(),
  ];
}

export function defaultReceitaTitle(patientName: string): string {
  return `Receita — ${patientName}`;
}
