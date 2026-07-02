import type { AtestadoPayload, ClinicalTemplateDefinition } from "./types";

export const atestadoTemplate: ClinicalTemplateDefinition = {
  id: "atestado",
  label: "Atestado",
  documentTitle: "Atestado Médico",
  pdfSubject: "Atestado odontológico",
};

export function buildAtestadoLines(payload: AtestadoPayload): string[] {
  const daysLabel = payload.daysOff === 1 ? "1 dia" : `${payload.daysOff} dias`;
  const lines = [
    `Paciente: ${payload.patientName}`,
    "",
    `Atesto, para os devidos fins, que o(a) paciente acima necessita de afastamento de suas atividades por ${daysLabel}.`,
  ];

  if (payload.reason?.trim()) {
    lines.push("", `Motivo: ${payload.reason.trim()}`);
  }

  return lines;
}

export function defaultAtestadoTitle(patientName: string): string {
  return `Atestado — ${patientName}`;
}
