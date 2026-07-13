import type { PlanKey, ModuleKey } from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/subscription";
import type { FoundingStage } from "./founding-pipeline";

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
  | "id"
  | "name"
  | "slug"
  | "subscription_status"
  | "plan_key"
  | "trial_ends_at"
  | "deleted_at"
  | "created_at"
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

export type AdminClinicListFilters = {
  planKey?: PlanKey;
  status?: SubscriptionStatus;
  moduleKey?: ModuleKey;
  fairUseAlert?: boolean;
  search?: string;
};

export type FairUseAlertRow = AdminClinicRecord & {
  fairUse: FairUseStatus;
  fairUseLevel: FairUseLevel;
};

export type AdminActionKind =
  | "trial_expiring"
  | "past_due"
  | "founder_pending_signup"
  | "clinic_no_adoption"
  | "fair_use_alert";

export type AdminActionItem = {
  id: string;
  kind: AdminActionKind;
  title: string;
  subtitle: string;
  href: string;
  sortDate: string;
};

export type FoundingSummary = {
  totalFounders: number;
  newFoundersLast7Days: number;
  convertedCount: number;
  conversionRate: number;
  topInviteRefs: Array<{ ref: string; count: number }>;
};

export type AdminDashboardData = {
  kpis: DashboardKpis;
  trialsExpiring: AdminClinicMetricsInput[];
  fairUseAlerts: FairUseAlertRow[];
  actionQueue: AdminActionItem[];
  recentAudit: AdminAuditLogRow[];
  newClinics: AdminClinicMetricsInput[];
  foundingSummary: FoundingSummary;
};

export type FounderFeedbackStatus = "pending" | "sent" | "follow_up";

export type FounderAdminRow = {
  id: string;
  ref_slug: string | null;
  full_name: string;
  clinic_name: string;
  city: string;
  state: string;
  whatsapp: string;
  email: string;
  invite_ref: string | null;
  feedback_status: FounderFeedbackStatus;
  clinic_id: string | null;
  created_at: string;
  accessed_at: string | null;
  signup_completed_at: string | null;
  patient_count: number;
  appointment_count: number;
  referral_count: number;
  stage: FoundingStage;
  referral_url: string | null;
};

export type BetaFeedbackAdminRow = {
  id: string;
  created_at: string;
  clinic_id: string | null;
  clinic_name: string | null;
  author_name: string | null;
  nps: number;
  top_module: "agenda" | "pacientes" | "prontuario" | "outro";
  liked_most: string;
  blocked_or_missing: string;
  would_use_today: "yes" | "maybe" | "no";
  notes: string | null;
};

export type ClinicModuleRow = {
  module_key: string;
  enabled: boolean;
};

export type AsaasWebhookEventRow = {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ClinicDetailForAdmin = {
  clinic: ClinicDetail;
  modules: ClinicModuleRow[];
  webhookEvents: AsaasWebhookEventRow[];
  storageBytes: number;
  yearMonth: string;
};

export type AdminAuditLogRow = {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  clinic_id: string | null;
  clinic_name: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AdminAuditLogFilters = {
  clinicId?: string;
  action?: string;
};
