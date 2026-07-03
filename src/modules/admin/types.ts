import type { PlanKey } from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/subscription";

export type { PlanKey };

export type FairUseLevel = "ok" | "warning" | "exceeded";

export type FairUseCaps = {
  whatsapp: number | null;
  ai: number | null;
};

export type FairUseMetric = {
  usage: number;
  cap: number | null;
  percent: number | null;
  level: FairUseLevel;
};

export type FairUseStatus = {
  whatsapp: FairUseMetric;
  ai: FairUseMetric;
};

export type DashboardKpis = {
  activeCount: number;
  trialingCount: number;
  pastDueCount: number;
  closedCount: number;
  estimatedMrr: number;
};

export type AdminClinicRecord = {
  id: string;
  name: string;
  slug: string;
  subscription_status: SubscriptionStatus;
  plan_key: PlanKey;
  trial_ends_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

/** Input mínimo para agregações de dashboard (sem fair use calculado). */
export type AdminClinicMetricsInput = Pick<
  AdminClinicRecord,
  "id" | "name" | "slug" | "subscription_status" | "plan_key" | "trial_ends_at" | "deleted_at"
>;

export type ClinicListRow = AdminClinicRecord & {
  whatsappUsagePercent: number | null;
  aiUsagePercent: number | null;
  fairUseLevel: FairUseLevel;
};

export type ClinicDetail = AdminClinicRecord & {
  fairUse: FairUseStatus;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  admin_notes: string | null;
  whatsapp_throttled: boolean;
};
