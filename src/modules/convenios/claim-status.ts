import type { InsuranceClaimStatus } from "./types";

export const CLAIM_STATUS_LABELS: Record<InsuranceClaimStatus, string> = {
  draft: "Rascunho",
  awaiting_auth: "Aguardando autorização",
  authorized: "Autorizada",
  submitted: "Enviada",
  paid: "Paga",
  partial_glosa: "Glosa parcial",
  glosa: "Glosada",
  appealing: "Em recurso",
};

export const CLAIM_STATUS_ORDER: InsuranceClaimStatus[] = [
  "draft",
  "awaiting_auth",
  "authorized",
  "submitted",
  "paid",
  "partial_glosa",
  "glosa",
  "appealing",
];

export const GLOSA_STATUSES: InsuranceClaimStatus[] = [
  "partial_glosa",
  "glosa",
  "appealing",
];

/**
 * Statuses that count as an open receivable (money the clinic still expects
 * from the operadora). Excludes fully paid and fully glosa'd claims.
 */
export const OPEN_RECEIVABLE_STATUSES: InsuranceClaimStatus[] = [
  "draft",
  "awaiting_auth",
  "authorized",
  "submitted",
  "partial_glosa",
  "appealing",
];

const ALLOWED_TRANSITIONS: Record<
  InsuranceClaimStatus,
  InsuranceClaimStatus[]
> = {
  // v8.0 manual: atalhos de rascunho para desfecho (glosa/pagamento parcial)
  draft: [
    "awaiting_auth",
    "authorized",
    "submitted",
    "partial_glosa",
    "glosa",
  ],
  awaiting_auth: ["authorized", "submitted", "glosa"],
  authorized: ["submitted", "draft"],
  submitted: ["paid", "partial_glosa", "glosa"],
  paid: [],
  partial_glosa: ["appealing", "paid"],
  glosa: ["appealing"],
  appealing: ["paid", "partial_glosa", "glosa"],
};

/** Status atual + próximos permitidos (para selects na UI). */
export function listSelectableClaimStatuses(
  from: InsuranceClaimStatus,
): InsuranceClaimStatus[] {
  const next = ALLOWED_TRANSITIONS[from] ?? [];
  const unique = new Set<InsuranceClaimStatus>([from, ...next]);
  return CLAIM_STATUS_ORDER.filter((status) => unique.has(status));
}

export function canTransitionClaimStatus(
  from: InsuranceClaimStatus,
  to: InsuranceClaimStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isGlosaStatus(status: InsuranceClaimStatus): boolean {
  return GLOSA_STATUSES.includes(status);
}

export function isOpenReceivable(status: InsuranceClaimStatus): boolean {
  return OPEN_RECEIVABLE_STATUSES.includes(status);
}
