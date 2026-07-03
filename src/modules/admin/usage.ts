import type { PlanKey } from "@/lib/billing/plans";
import type { FairUseCaps, FairUseLevel } from "./types";

export const FAIR_USE_CAPS: Record<PlanKey, FairUseCaps> = {
  essencial: { whatsapp: null, ai: null },
  conecta: { whatsapp: 1200, ai: null },
  inteligente: { whatsapp: 1200, ai: 1500 },
  completo: { whatsapp: 2500, ai: 3500 },
};

export function getFairUseCaps(planKey: PlanKey): FairUseCaps {
  return FAIR_USE_CAPS[planKey];
}

export function computeFairUsePercent(
  usage: number,
  cap: number | null,
): number | null {
  if (cap === null || cap <= 0) return null;
  return (usage / cap) * 100;
}

export function getFairUseLevel(percent: number | null): FairUseLevel {
  if (percent === null) return "ok";
  if (percent >= 100) return "exceeded";
  if (percent >= 80) return "warning";
  return "ok";
}
