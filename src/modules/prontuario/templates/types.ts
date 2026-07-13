export type ClinicalDocumentTemplate = "receita" | "atestado" | "guia";

export type ClinicContactInfo = {
  whatsapp?: string | null;
  instagram?: string | null;
  email?: string | null;
  address?: string | null;
};

export type ClinicalDocumentContext = {
  clinicName: string;
  patientName: string;
  dentistName: string;
  dentistCro?: string | null;
  dentistSpecialty?: string | null;
  issuedAt: Date;
  signatureImageBytes?: Uint8Array | null;
  clinicLogoImageBytes?: Uint8Array | null;
  clinicContact?: ClinicContactInfo | null;
};

export type ReceitaPayload = ClinicalDocumentContext & {
  template: "receita";
  medications: string;
};

export type AtestadoPayload = ClinicalDocumentContext & {
  template: "atestado";
  daysOff: number;
  reason?: string | null;
  cidPatientAuthorized: boolean;
  cid?: { code: string; label: string } | null;
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
