import { PLAN_PRICES } from "@/lib/billing/plans";
import type { AdminClinicMetricsInput, DashboardKpis } from "./types";

function isClosed(clinic: AdminClinicMetricsInput): boolean {
  return (
    clinic.deleted_at !== null ||
    clinic.subscription_status === "expired" ||
    clinic.subscription_status === "canceled"
  );
}

function isPaying(clinic: AdminClinicMetricsInput): boolean {
  return (
    !clinic.deleted_at &&
    (clinic.subscription_status === "active" ||
      clinic.subscription_status === "past_due")
  );
}

export function estimateMrr(clinics: AdminClinicMetricsInput[]): number {
  return clinics
    .filter(isPaying)
    .reduce((sum, clinic) => sum + PLAN_PRICES[clinic.plan_key], 0);
}

export function computeDashboardKpis(
  clinics: AdminClinicMetricsInput[],
): DashboardKpis {
  const open = clinics.filter((c) => !c.deleted_at);

  return {
    activeCount: open.filter((c) => c.subscription_status === "active").length,
    trialingCount: open.filter((c) => c.subscription_status === "trialing")
      .length,
    pastDueCount: open.filter((c) => c.subscription_status === "past_due")
      .length,
    closedCount: clinics.filter(isClosed).length,
    estimatedMrr: estimateMrr(clinics),
  };
}

export function trialsExpiringSoon(
  clinics: AdminClinicMetricsInput[],
  days = 7,
  now: Date = new Date(),
): AdminClinicMetricsInput[] {
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  const nowMs = now.getTime();
  const endMs = end.getTime();

  return clinics
    .filter((clinic) => {
      if (clinic.deleted_at) return false;
      if (clinic.subscription_status !== "trialing") return false;
      if (!clinic.trial_ends_at) return false;
      const endsMs = new Date(clinic.trial_ends_at).getTime();
      return endsMs >= nowMs && endsMs <= endMs;
    })
    .sort(
      (a, b) =>
        new Date(a.trial_ends_at!).getTime() -
        new Date(b.trial_ends_at!).getTime(),
    );
}
