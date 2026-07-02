export type ClinicalDocumentTemplate = "receita" | "atestado" | "guia";

export type ClinicalDocumentContext = {
  clinicName: string;
  patientName: string;
  dentistName: string;
  dentistCro?: string | null;
  dentistSpecialty?: string | null;
  issuedAt: Date;
  signatureImageBytes?: Uint8Array | null;
};

export type ReceitaPayload = ClinicalDocumentContext & {
  template: "receita";
  medications: string;
};

export type AtestadoPayload = ClinicalDocumentContext & {
  template: "atestado";
  daysOff: number;
  reason?: string | null;
};

export type GuiaPayload = ClinicalDocumentContext & {
  template: "guia";
  exams: string;
};

export type ClinicalPdfPayload =
  | ReceitaPayload
  | AtestadoPayload
  | GuiaPayload;

export type ClinicalTemplateDefinition = {
  id: ClinicalDocumentTemplate;
  label: string;
  documentTitle: string;
  pdfSubject: string;
};
