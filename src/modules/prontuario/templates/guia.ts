import type { ClinicalTemplateDefinition, GuiaPayload } from "./types";

export const guiaTemplate: ClinicalTemplateDefinition = {
  id: "guia",
  label: "Guia de exame",
  documentTitle: "Guia de Exame",
  pdfSubject: "Guia de exame odontológico",
};

export function buildGuiaLines(payload: GuiaPayload): string[] {
  return [
    `Paciente: ${payload.patientName}`,
    "",
    "Exames / procedimentos solicitados:",
    payload.exams.trim(),
  ];
}

export function defaultGuiaTitle(patientName: string): string {
  return `Guia de exame — ${patientName}`;
}
