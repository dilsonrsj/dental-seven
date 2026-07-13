import type { PlanKey } from "@/lib/billing/plans";

export function resolveSignupPlanKey(
  requested: PlanKey,
  betaGateEnabled: boolean,
): PlanKey {
  return betaGateEnabled ? "inteligente" : requested;
}
