import type { ClinicalDocumentTemplate, ClinicalPdfPayload } from "./templates/types";
import { getDentalCidByCode } from "./data/dental-cid-list";
import { defaultAtestadoTitle } from "./templates/atestado";
import { defaultGuiaTitle } from "./templates/guia";
import { defaultReceitaTitle } from "./templates/receita";

export type ClinicalDocumentFormInput = {
  template: ClinicalDocumentTemplate;
  medications?: string;
  daysOff?: number;
  reason?: string;
  exams?: string;
  customTitle?: string;
  cidPatientAuthorized?: boolean;
  cidCode?: string;
};

export function buildDocumentTitle(
  input: ClinicalDocumentFormInput,
  patientName: string,
): string {
  const custom = input.customTitle?.trim();
  if (custom) return custom.slice(0, 200);

  switch (input.template) {
    case "receita":
      return defaultReceitaTitle(patientName);
    case "atestado":
      return defaultAtestadoTitle(patientName);
    case "guia":
      return defaultGuiaTitle(patientName);
    default: {
      const exhaustive: never = input.template;
      return exhaustive;
    }
  }
}

export function validateClinicalDocumentInput(input: ClinicalDocumentFormInput) {
  switch (input.template) {
    case "receita":
      if (!input.medications?.trim()) {
        throw new Error("Informe a prescrição ou orientações da receita.");
      }
      return;
    case "atestado": {
      const days = Number(input.daysOff);
      if (!Number.isFinite(days) || days < 1 || days > 365) {
        throw new Error("Informe os dias de afastamento (1 a 365).");
      }
      if (input.cidPatientAuthorized) {
        const code = input.cidCode?.trim();
        if (!code || !getDentalCidByCode(code)) {
          throw new Error("Selecione o CID autorizado pelo paciente.");
        }
      }
      return;
    }
    case "guia":
      if (!input.exams?.trim()) {
        throw new Error("Informe os exames ou procedimentos solicitados.");
      }
      return;
    default: {
      const exhaustive: never = input.template;
      return exhaustive;
    }
  }
}

export function toClinicalPdfPayload(
  input: ClinicalDocumentFormInput,
  context: {
    clinicName: string;
    patientName: string;
    dentistName: string;
    dentistCro?: string | null;
    dentistSpecialty?: string | null;
    signatureImageBytes?: Uint8Array | null;
    clinicLogoImageBytes?: Uint8Array | null;
    issuedAt?: Date;
    clinicContact?: {
      whatsapp?: string | null;
      instagram?: string | null;
      email?: string | null;
      address?: string | null;
    } | null;
  },
): ClinicalPdfPayload {
  validateClinicalDocumentInput(input);

  const base = {
    clinicName: context.clinicName,
    patientName: context.patientName,
    dentistName: context.dentistName,
    dentistCro: context.dentistCro ?? null,
    dentistSpecialty: context.dentistSpecialty ?? null,
    issuedAt: context.issuedAt ?? new Date(),
    signatureImageBytes: context.signatureImageBytes ?? null,
    clinicLogoImageBytes: context.clinicLogoImageBytes ?? null,
    clinicContact: context.clinicContact ?? null,
  };

  switch (input.template) {
    case "receita":
      return {
        ...base,
        template: "receita",
        medications: input.medications!.trim(),
      };
    case "atestado": {
      const authorized = Boolean(input.cidPatientAuthorized);
      const cidEntry = authorized
        ? getDentalCidByCode(input.cidCode ?? "")
        : undefined;
      return {
        ...base,
        template: "atestado",
        daysOff: Number(input.daysOff),
        reason: input.reason?.trim() || null,
        cidPatientAuthorized: authorized,
        cid: cidEntry ? { code: cidEntry.code, label: cidEntry.label } : null,
      };
    }
    case "guia":
      return {
        ...base,
        template: "guia",
        exams: input.exams!.trim(),
      };
    default: {
      const exhaustive: never = input.template;
      return exhaustive;
    }
  }
}
