import {
  normalizeAnamnesisResponses,
  type AnamnesisResponses,
} from "./template-v1";

export type AnamnesisAlerts = {
  has_critical_alert: boolean;
  badges: string[];
};

const ANTICOAGULANT_KEYWORDS = [
  "anticoagulante",
  "varfarina",
  "warfarina",
  "marevan",
  "xarelto",
  "rivaroxabana",
  "eliquis",
  "apixabana",
  "pradaxa",
  "dabigatrana",
  "clexane",
  "enoxaparina",
  "heparina",
  "clopidogrel",
  "aspirina",
  "aas",
];

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasAnticoagulantKeyword(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return ANTICOAGULANT_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
}

/**
 * Pure function that derives critical clinical alerts from anamnesis responses.
 * Used both to render the warning banner and to persist `has_critical_alert`.
 */
export function computeAnamnesisAlerts(
  raw: AnamnesisResponses | unknown,
): AnamnesisAlerts {
  const responses = normalizeAnamnesisResponses(raw);
  const badges: string[] = [];

  if (hasText(responses.allergies)) {
    badges.push("Alergia informada");
  }
  if (responses.pregnant === true) {
    badges.push("Gestante");
  }
  if (responses.hypertension === true) {
    badges.push("Hipertensão");
  }
  if (responses.diabetes === true) {
    badges.push("Diabetes");
  }
  if (responses.heart_disease === true) {
    badges.push("Cardiopatia");
  }
  if (responses.bleeding_disorder === true) {
    badges.push("Distúrbio de coagulação");
  }
  if (hasText(responses.anesthesia_complications)) {
    badges.push("Complicações com anestesia");
  }
  if (
    hasText(responses.medications) &&
    hasAnticoagulantKeyword(String(responses.medications))
  ) {
    badges.push("Uso de anticoagulante");
  }

  return {
    has_critical_alert: badges.length > 0,
    badges,
  };
}
