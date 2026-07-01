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
  | "fornecedores";

export const PLAN_PRICES: Record<PlanKey, number> = {
  essencial: 99,
  conecta: 149,
  inteligente: 279,
  completo: 349,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  essencial: "Essencial",
  conecta: "Conecta",
  inteligente: "Inteligente",
  completo: "Completo",
};

export const PLAN_MODULES: Record<PlanKey, ModuleKey[]> = {
  essencial: ["agenda", "pacientes"],
  conecta: ["agenda", "pacientes", "whatsapp"],
  inteligente: ["agenda", "pacientes", "whatsapp", "ai_agent"],
  completo: [
    "agenda",
    "pacientes",
    "whatsapp",
    "ai_agent",
    "prontuario",
    "procedimentos",
    "estoque",
    "financeiro",
    "fornecedores",
  ],
};

export const PLAN_DENTIST_LIMIT: Record<PlanKey, number> = {
  essencial: 1,
  conecta: 3,
  inteligente: 3,
  completo: 3,
};

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
  if (
    moduleKey === "prontuario" ||
    moduleKey === "procedimentos" ||
    moduleKey === "estoque" ||
    moduleKey === "financeiro" ||
    moduleKey === "fornecedores"
  ) {
    return false;
  }
  return true;
}
