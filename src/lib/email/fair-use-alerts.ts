import { PLAN_LABELS } from "@/lib/billing/plans";
import { logAdminAction } from "@/modules/admin/audit";
import {
  buildFairUseAlertKey,
  detectFairUseEmailAlerts,
  type FairUseAlertMetric,
  type FairUseAlertThreshold,
} from "@/modules/admin/fair-use-alerts";
import { getCurrentYearMonth } from "@/modules/admin/sync-usage";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";

async function getClinicAdminEmail(clinicId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("role", "clinic_admin")
    .limit(1)
    .maybeSingle();

  if (!profile) return null;

  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  return userData.user?.email ?? null;
}

function metricLabel(metric: FairUseAlertMetric): string {
  return metric === "whatsapp" ? "WhatsApp" : "IA";
}

function buildEmailHtml(
  clinicName: string,
  metric: FairUseAlertMetric,
  threshold: FairUseAlertThreshold,
  percent: number,
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const metricName = metricLabel(metric);
  const subject =
    threshold === "100"
      ? `Uso de ${metricName} atingiu 100% do limite mensal`
      : `Uso de ${metricName} atingiu 80% do limite mensal`;

  return `<p>Olá,</p>
<p>A clínica <strong>${clinicName}</strong> atingiu <strong>${Math.round(percent)}%</strong> do limite mensal de ${metricName} (${threshold === "100" ? "limite atingido" : "alerta de uso"}).</p>
<p>${subject}.</p>
<p><a href="${appUrl}/configuracoes">Ver plano e uso</a></p>`;
}

async function loadSentFairUseAlertKeys(
  yearMonth: string,
): Promise<Set<string>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_audit_log")
    .select("clinic_id, metadata")
    .eq("action", "fair_use.email_sent")
    .gte("created_at", `${yearMonth}-01T00:00:00.000Z`);

  if (error) throw new Error(error.message);

  const sent = new Set<string>();
  for (const row of data ?? []) {
    const meta = row.metadata as Record<string, unknown> | null;
    if (
      row.clinic_id &&
      meta?.yearMonth === yearMonth &&
      typeof meta.metric === "string" &&
      typeof meta.threshold === "string"
    ) {
      sent.add(
        buildFairUseAlertKey(
          row.clinic_id,
          yearMonth,
          meta.metric as FairUseAlertMetric,
          meta.threshold as FairUseAlertThreshold,
        ),
      );
    }
  }
  return sent;
}

export async function processFairUseAlertEmails(
  actorId: string,
): Promise<{ sent: number }> {
  const admin = createAdminClient();
  const yearMonth = getCurrentYearMonth();

  const { data: clinics, error: clinicsError } = await admin
    .from("clinics")
    .select("id, name, plan_key, deleted_at")
    .is("deleted_at", null);

  if (clinicsError) throw new Error(clinicsError.message);

  const { data: usageRows, error: usageError } = await admin
    .from("clinic_usage_monthly")
    .select("clinic_id, whatsapp_conversations, ai_responses")
    .eq("year_month", yearMonth);

  if (usageError) throw new Error(usageError.message);

  const usageMap = new Map<
    string,
    { whatsapp_conversations: number; ai_responses: number }
  >();
  for (const row of usageRows ?? []) {
    usageMap.set(row.clinic_id, {
      whatsapp_conversations: row.whatsapp_conversations,
      ai_responses: row.ai_responses,
    });
  }

  const sentKeys = await loadSentFairUseAlertKeys(yearMonth);
  const alerts = detectFairUseEmailAlerts(
    (clinics ?? []) as Parameters<typeof detectFairUseEmailAlerts>[0],
    usageMap,
    yearMonth,
    sentKeys,
  );

  let sent = 0;

  for (const alert of alerts) {
    const email = await getClinicAdminEmail(alert.clinicId);
    if (!email) continue;

    const metricName = metricLabel(alert.metric);
    const subject =
      alert.threshold === "100"
        ? `Dental Seven — ${metricName} atingiu 100% do limite`
        : `Dental Seven — ${metricName} atingiu 80% do limite`;

    await sendEmail({
      to: email,
      subject,
      html: buildEmailHtml(
        alert.clinicName,
        alert.metric,
        alert.threshold,
        alert.percent,
      ),
    });

    await logAdminAction({
      actorId,
      action: "fair_use.email_sent",
      clinicId: alert.clinicId,
      metadata: {
        yearMonth: alert.yearMonth,
        metric: alert.metric,
        threshold: alert.threshold,
        percent: alert.percent,
        planKey: alert.planKey,
        planLabel: PLAN_LABELS[alert.planKey],
        recipient: email,
        automated: true,
      },
    });

    sent++;
  }

  return { sent };
}
