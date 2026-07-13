import {
  EXTRA_DENTIST_PRICE,
  PLAN_DENTIST_LIMIT,
  type PlanKey,
} from "./plans";

export type DentistQuotaSummary = {
  included: number;
  active: number;
  extra: number;
  extraMonthlyCost: number;
  canAdd: boolean;
  requiresUpgrade: boolean;
  requiresExtraConfirm: boolean;
};

export type CanAddDentistResult =
  | { ok: true; requiresExtraConfirm: boolean; extraCharge: number }
  | { ok: false; reason: string; requiresUpgrade?: boolean };

export function getIncludedDentistLimit(planKey: PlanKey): number {
  return PLAN_DENTIST_LIMIT[planKey];
}

export function countActiveDentists(activeFlags: boolean[]): number {
  return activeFlags.filter(Boolean).length;
}

export function getDentistQuotaSummary(input: {
  planKey: PlanKey;
  activeCount: number;
}): DentistQuotaSummary {
  const included = getIncludedDentistLimit(input.planKey);
  const extra = Math.max(0, input.activeCount - included);
  const requiresUpgrade =
    input.planKey === "essencial" && input.activeCount >= included;
  const requiresExtraConfirm =
    input.planKey !== "essencial" && input.activeCount >= included;
  const canAdd = !requiresUpgrade;

  return {
    included,
    active: input.activeCount,
    extra,
    extraMonthlyCost: extra * EXTRA_DENTIST_PRICE,
    canAdd,
    requiresUpgrade,
    requiresExtraConfirm,
  };
}

export function assertCanAddDentist(input: {
  planKey: PlanKey;
  activeCount: number;
  confirmExtraCharge?: boolean;
}): CanAddDentistResult {
  const included = getIncludedDentistLimit(input.planKey);

  if (input.planKey === "essencial" && input.activeCount >= included) {
    return {
      ok: false,
      requiresUpgrade: true,
      reason:
        "O plano Essencial inclui 1 dentista. Faça upgrade para Conecta para adicionar mais profissionais.",
    };
  }

  if (input.activeCount >= included) {
    if (!input.confirmExtraCharge) {
      return {
        ok: false,
        reason: `Dentista extra: +R$ ${EXTRA_DENTIST_PRICE}/mês na mensalidade. Confirme para continuar.`,
      };
    }

    return {
      ok: true,
      requiresExtraConfirm: true,
      extraCharge: EXTRA_DENTIST_PRICE,
    };
  }

  return {
    ok: true,
    requiresExtraConfirm: false,
    extraCharge: 0,
  };
}

export function getQuotaAfterInvite(input: {
  planKey: PlanKey;
  activeCountBefore: number;
}): {
  activeAfter: number;
  extraAfter: number;
  extraMonthlyCostAfter: number;
} {
  const included = getIncludedDentistLimit(input.planKey);
  const activeAfter = input.activeCountBefore + 1;
  const extraAfter = Math.max(0, activeAfter - included);

  return {
    activeAfter,
    extraAfter,
    extraMonthlyCostAfter: extraAfter * EXTRA_DENTIST_PRICE,
  };
}
