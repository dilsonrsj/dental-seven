export const ANAMNESIS_TEMPLATE_VERSION = "v1";

export type AnamnesisFieldType = "boolean" | "text";
export type AnamnesisSection = "geral" | "condicoes" | "historico";

export type AnamnesisField = {
  key: string;
  type: AnamnesisFieldType;
  label: string;
  section: AnamnesisSection;
  placeholder?: string;
};

export type AnamnesisResponseValue = boolean | string;
export type AnamnesisResponses = Record<string, AnamnesisResponseValue>;

export const ANAMNESIS_SECTION_LABELS: Record<AnamnesisSection, string> = {
  geral: "Geral",
  condicoes: "Condições de saúde",
  historico: "Histórico",
};

export const ANAMNESIS_SECTION_ORDER: AnamnesisSection[] = [
  "geral",
  "condicoes",
  "historico",
];

export const ANAMNESIS_FIELDS: AnamnesisField[] = [
  {
    key: "chief_complaint",
    type: "text",
    label: "Queixa principal",
    section: "geral",
    placeholder: "Motivo da consulta relatado pelo paciente",
  },
  {
    key: "smoker",
    type: "boolean",
    label: "Fumante",
    section: "geral",
  },
  {
    key: "systemic_diseases",
    type: "text",
    label: "Doenças sistêmicas",
    section: "condicoes",
    placeholder: "Descreva doenças sistêmicas conhecidas",
  },
  {
    key: "medications",
    type: "text",
    label: "Medicamentos em uso",
    section: "condicoes",
    placeholder: "Liste medicamentos e dosagens",
  },
  {
    key: "allergies",
    type: "text",
    label: "Alergias",
    section: "condicoes",
    placeholder: "Alergias a medicamentos, látex, anestésicos etc.",
  },
  {
    key: "pregnant",
    type: "boolean",
    label: "Gestante",
    section: "condicoes",
  },
  {
    key: "hypertension",
    type: "boolean",
    label: "Hipertensão",
    section: "condicoes",
  },
  {
    key: "diabetes",
    type: "boolean",
    label: "Diabetes",
    section: "condicoes",
  },
  {
    key: "heart_disease",
    type: "boolean",
    label: "Cardiopatia",
    section: "condicoes",
  },
  {
    key: "bleeding_disorder",
    type: "boolean",
    label: "Distúrbio de coagulação",
    section: "condicoes",
  },
  {
    key: "previous_surgeries",
    type: "text",
    label: "Cirurgias anteriores",
    section: "historico",
    placeholder: "Cirurgias e procedimentos relevantes",
  },
  {
    key: "anesthesia_complications",
    type: "text",
    label: "Complicações com anestesia",
    section: "historico",
    placeholder: "Reações ou complicações prévias com anestesia",
  },
  {
    key: "additional_notes",
    type: "text",
    label: "Observações adicionais",
    section: "historico",
    placeholder: "Outras informações relevantes",
  },
];

const FIELD_BY_KEY = new Map(ANAMNESIS_FIELDS.map((field) => [field.key, field]));

export function getAnamnesisField(key: string): AnamnesisField | undefined {
  return FIELD_BY_KEY.get(key);
}

export function fieldsForSection(section: AnamnesisSection): AnamnesisField[] {
  return ANAMNESIS_FIELDS.filter((field) => field.section === section);
}

export function emptyAnamnesisResponses(): AnamnesisResponses {
  const responses: AnamnesisResponses = {};
  for (const field of ANAMNESIS_FIELDS) {
    responses[field.key] = field.type === "boolean" ? false : "";
  }
  return responses;
}

/**
 * Coerce arbitrary input into a valid responses object, keeping only known
 * template keys and enforcing the declared type for each field.
 */
export function normalizeAnamnesisResponses(
  raw: unknown,
): AnamnesisResponses {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const responses: AnamnesisResponses = {};

  for (const field of ANAMNESIS_FIELDS) {
    const value = source[field.key];
    if (field.type === "boolean") {
      responses[field.key] = value === true || value === "true";
    } else {
      responses[field.key] = typeof value === "string" ? value.trim() : "";
    }
  }

  return responses;
}
