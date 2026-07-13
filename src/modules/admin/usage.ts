import type { PlanKey } from "@/lib/billing/plans";
import type { FairUseCaps, FairUseLevel, FairUseStatus } from "./types";

export const FAIR_USE_CAPS: Record<PlanKey, FairUseCaps> = {
  essencial: { whatsapp: null, ai: null },
  conecta: { whatsapp: null, ai: null },
  inteligente: { whatsapp: null, ai: null },
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

export type MonthlyUsageInput = {
  whatsapp_conversations: number;
  ai_responses: number;
};

export function buildFairUseStatus(
  planKey: PlanKey,
  usage: MonthlyUsageInput,
): FairUseStatus {
  const caps = getFairUseCaps(planKey);
  const whatsappPercent = computeFairUsePercent(
    usage.whatsapp_conversations,
    caps.whatsapp,
  );
  const aiPercent = computeFairUsePercent(usage.ai_responses, caps.ai);

  return {
    whatsapp: {
      usage: usage.whatsapp_conversations,
      cap: caps.whatsapp,
      percent: whatsappPercent,
      level: getFairUseLevel(whatsappPercent),
    },
    ai: {
      usage: usage.ai_responses,
      cap: caps.ai,
      percent: aiPercent,
      level: getFairUseLevel(aiPercent),
    },
  };
}

export function getOverallFairUseLevel(status: FairUseStatus): FairUseLevel {
  const levels = [status.whatsapp.level, status.ai.level];
  if (levels.includes("exceeded")) return "exceeded";
  if (levels.includes("warning")) return "warning";
  return "ok";
}
