import type { PlanKey } from "@/lib/billing/plans";
import { buildFairUseStatus } from "./usage";

export type FairUseAlertThreshold = "80" | "100";
export type FairUseAlertMetric = "whatsapp" | "ai";

export type FairUseEmailAlert = {
  clinicId: string;
  clinicName: string;
  planKey: PlanKey;
  metric: FairUseAlertMetric;
  threshold: FairUseAlertThreshold;
  percent: number;
  yearMonth: string;
};

export type FairUseAlertClinicInput = {
  id: string;
  name: string;
  plan_key: PlanKey;
  deleted_at: string | null;
};

export type MonthlyUsage = {
  whatsapp_conversations: number;
  ai_responses: number;
};

export function buildFairUseAlertKey(
  clinicId: string,
  yearMonth: string,
  metric: FairUseAlertMetric,
  threshold: FairUseAlertThreshold,
): string {
  return `${clinicId}:${yearMonth}:${metric}:${threshold}`;
}

export function detectFairUseEmailAlerts(
  clinics: FairUseAlertClinicInput[],
  usageMap: Map<string, MonthlyUsage>,
  yearMonth: string,
  sentKeys: Set<string>,
): FairUseEmailAlert[] {
  const alerts: FairUseEmailAlert[] = [];

  for (const clinic of clinics) {
    if (clinic.deleted_at) continue;

    const usage = usageMap.get(clinic.id) ?? {
      whatsapp_conversations: 0,
      ai_responses: 0,
    };
    const fairUse = buildFairUseStatus(clinic.plan_key, usage);

    const metrics: Array<{
      metric: FairUseAlertMetric;
      percent: number | null;
    }> = [
      { metric: "whatsapp", percent: fairUse.whatsapp.percent },
      { metric: "ai", percent: fairUse.ai.percent },
    ];

    for (const { metric, percent } of metrics) {
      if (percent === null) continue;

      const threshold: FairUseAlertThreshold | null =
        percent >= 100 ? "100" : percent >= 80 ? "80" : null;

      if (!threshold) continue;

      const key = buildFairUseAlertKey(
        clinic.id,
        yearMonth,
        metric,
        threshold,
      );
      if (sentKeys.has(key)) continue;

      alerts.push({
        clinicId: clinic.id,
        clinicName: clinic.name,
        planKey: clinic.plan_key,
        metric,
        threshold,
        percent,
        yearMonth,
      });
    }
  }

  return alerts;
}
