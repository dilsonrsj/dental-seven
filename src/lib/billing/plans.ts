export type PlanKey = "essencial" | "conecta" | "inteligente" | "completo";

export type ModuleKey =
  | "agenda"
  | "pacientes"
  | "whatsapp"
  | "ai_agent"
  | "prontuario"
  | "procedimentos"
  | "estoque"
  | "financeiro"
  | "fornecedores"
  | "convenios";

export const PLAN_LIST_PRICES: Record<PlanKey, number> = {
  essencial: 124,
  conecta: 187,
  inteligente: 349,
  completo: 437,
};

/** Oferta mensal (preço cobrado). */
export const PLAN_PRICES: Record<PlanKey, number> = {
  essencial: 99,
  conecta: 150,
  inteligente: 279,
  completo: 349,
};

/** Anual: −25% sobre a lista · parcela em 12×. */
export const PLAN_ANNUAL_MONTHLY: Record<PlanKey, number> = {
  essencial: 93,
  conecta: 140.25,
  inteligente: 261.75,
  completo: 327.75,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  essencial: "Essencial",
  conecta: "Conecta",
  inteligente: "Inteligente",
  completo: "Completo",
};

export const PLAN_TAGLINES: Record<PlanKey, string> = {
  essencial: "Agenda, prontuário e financeiro",
  conecta: "Clínica digital + agendamento por voz",
  inteligente: "Gestão completa",
  completo: "WhatsApp + IA",
};

export const PLAN_MODULES: Record<PlanKey, ModuleKey[]> = {
  essencial: ["agenda", "pacientes"],
  conecta: ["agenda", "pacientes", "prontuario", "procedimentos"],
  inteligente: [
    "agenda",
    "pacientes",
    "prontuario",
    "procedimentos",
    "estoque",
    "financeiro",
    "convenios",
  ],
  completo: [
    "agenda",
    "pacientes",
    "prontuario",
    "procedimentos",
    "estoque",
    "financeiro",
    "fornecedores",
    "convenios",
    "whatsapp",
    "ai_agent",
  ],
};

export const PLAN_DENTIST_LIMIT: Record<PlanKey, number> = {
  essencial: 1,
  conecta: 3,
  inteligente: 3,
  completo: 3,
};

export const EXTRA_DENTIST_PRICE = 20;

export function isModuleEnabledForPlan(
  planKey: PlanKey,
  moduleKey: ModuleKey,
): boolean {
  return PLAN_MODULES[planKey].includes(moduleKey);
}

export function defaultModuleEnabled(
  planKey: PlanKey,
  moduleKey: ModuleKey,
): boolean {
  if (!isModuleEnabledForPlan(planKey, moduleKey)) return false;
  if (moduleKey === "ai_agent") return false;
  return true;
}
