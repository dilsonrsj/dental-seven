import { PLAN_LABELS } from "@/lib/billing/plans";
import { sendEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";

type ClinicRow = {
  id: string;
  name: string;
  plan_key: string;
  trial_ends_at: string;
  subscription_status: string;
};

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

function daysUntilTrialEnd(trialEndsAt: string): number {
  const end = new Date(trialEndsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export async function processTrialEmails(): Promise<{
  reminders: number;
  expired: number;
}> {
  const admin = createAdminClient();
  const { data: clinics } = await admin
    .from("clinics")
    .select("id, name, plan_key, trial_ends_at, subscription_status")
    .eq("subscription_status", "trialing")
    .is("deleted_at", null);

  let reminders = 0;
  let expired = 0;

  for (const clinic of (clinics ?? []) as ClinicRow[]) {
    const daysLeft = daysUntilTrialEnd(clinic.trial_ends_at);
    const email = await getClinicAdminEmail(clinic.id);
    if (!email) continue;

    const planLabel = PLAN_LABELS[clinic.plan_key as keyof typeof PLAN_LABELS];

    if (daysLeft === 1) {
      await sendEmail({
        to: email,
        subject: "Seu trial Dental Seven termina amanhã",
        html: `<p>Olá,</p><p>O trial da clínica <strong>${clinic.name}</strong> (plano ${planLabel}) termina amanhã.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/configuracoes">Regularizar assinatura</a></p>`,
      });
      reminders++;
    }

    if (daysLeft <= 0) {
      await admin
        .from("clinics")
        .update({ subscription_status: "expired" })
        .eq("id", clinic.id)
        .eq("subscription_status", "trialing");

      await sendEmail({
        to: email,
        subject: "Seu trial Dental Seven encerrou",
        html: `<p>Olá,</p><p>O período de teste da clínica <strong>${clinic.name}</strong> (plano ${planLabel}) encerrou.</p><p>Regularize em Configurações para continuar usando o Dental Seven.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/configuracoes">Assinar agora</a></p>`,
      });
      expired++;
    }
  }

  return { reminders, expired };
}
