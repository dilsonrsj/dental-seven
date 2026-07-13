import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { signOut } from "@/lib/auth/actions";
import {
  createBillingSubscription,
  linkAsaasCustomer,
} from "@/lib/billing/actions";
import { isAsaasConfigured } from "@/lib/billing/asaas";
import { PLAN_LABELS, PLAN_PRICES } from "@/lib/billing/plans";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { getDentistProfile } from "@/modules/configuracoes/dentist-profile-actions";
import { DentistProfileForm } from "@/modules/configuracoes/dentist-profile-form";
import {
  getClinicContactSettings,
} from "@/modules/configuracoes/clinic-contact-actions";
import { ClinicContactForm } from "@/modules/configuracoes/clinic-contact-form";
import {
  getClinicLogoSettings,
} from "@/modules/configuracoes/clinic-logo-actions";
import { ClinicLogoForm } from "@/modules/configuracoes/clinic-logo-form";
import {
  getClinicOperatingHours,
  getDentistOperatingHours,
} from "@/modules/agenda/operating-hours-actions";
import { ClinicHoursForm } from "@/modules/configuracoes/clinic-hours-form";
import { DentistHoursForm } from "@/modules/configuracoes/dentist-hours-form";
import { getClinicTeam } from "@/modules/configuracoes/team-actions";
import { ClinicTeamForm } from "@/modules/configuracoes/clinic-team-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EncerramentoForm } from "./encerramento-form";

export default async function ConfiguracoesPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");

  const clinic = ctx.clinic;
  const trialEnd = clinic?.trial_ends_at
    ? new Date(clinic.trial_ends_at).toLocaleDateString("pt-BR")
    : "—";
  const asaasReady = isAsaasConfigured();
  const canManageBilling = ctx.profile.role === "clinic_admin";
  const targetDentistId =
    ctx.profile.dentist_id ?? ctx.dentists[0]?.id ?? null;
  const canManageDentistProfile =
    !!clinic &&
    ctx.enabledModules.includes("prontuario") &&
    !!targetDentistId &&
    (ctx.profile.role === "clinic_admin" || ctx.profile.role === "dentist");
  const dentistProfile = canManageDentistProfile
    ? await getDentistProfile(targetDentistId)
    : null;
  const clinicContacts =
    canManageBilling && clinic ? await getClinicContactSettings() : null;
  const clinicLogo =
    canManageBilling && clinic ? await getClinicLogoSettings() : null;
  const clinicHours =
    canManageBilling && clinic ? await getClinicOperatingHours() : null;
  const dentistHours =
    canManageDentistProfile && targetDentistId
      ? await getDentistOperatingHours(targetDentistId)
      : null;
  const clinicTeam =
    canManageBilling && clinic ? await getClinicTeam() : null;
  const canWriteTeam =
    !!clinic &&
    !isSubscriptionBlocking(clinic.subscription_status, ctx.profile.role);
  const canWriteDentistProfile =
    !!clinic &&
    !isSubscriptionBlocking(clinic.subscription_status, ctx.profile.role);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plano, assinatura e conta da clínica
        </p>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Assinatura</h2>
        {clinic ? (
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Plano</dt>
              <dd className="font-medium">
                {PLAN_LABELS[clinic.plan_key]} — R${" "}
                {PLAN_PRICES[clinic.plan_key]}/mês
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">
                {clinic.subscription_status}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Trial até</dt>
              <dd className="font-medium">{trialEnd}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Sem clínica vinculada.</p>
        )}
        {canManageBilling && asaasReady && clinic && (
          <div className="flex flex-wrap gap-2">
            <form action={linkAsaasCustomer}>
              <Button type="submit">Vincular Asaas</Button>
            </form>
            <form action={createBillingSubscription}>
              <Button type="submit" variant="outline">
                Criar assinatura
              </Button>
            </form>
          </div>
        )}
      </Card>

      {clinicContacts && (
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">
            Contatos no rodapé dos documentos
          </h2>
          <ClinicContactForm
            initial={clinicContacts}
            canWrite={canManageBilling && !isSubscriptionBlocking(clinic!.subscription_status, ctx.profile.role)}
          />
        </Card>
      )}

      {clinicLogo && (
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Logo da clínica</h2>
          <ClinicLogoForm
            initial={clinicLogo}
            canWrite={
              canManageBilling &&
              !isSubscriptionBlocking(clinic!.subscription_status, ctx.profile.role)
            }
          />
        </Card>
      )}

      {clinicHours && (
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">
            Horário da clínica
          </h2>
          <ClinicHoursForm
            initialSchedule={clinicHours}
            canWrite={
              canManageBilling &&
              !isSubscriptionBlocking(clinic!.subscription_status, ctx.profile.role)
            }
          />
        </Card>
      )}

      {clinicTeam && (
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">Equipe</h2>
          <ClinicTeamForm
            members={clinicTeam.members}
            quota={clinicTeam.quota}
            planKey={clinicTeam.planKey}
            canWrite={canWriteTeam}
          />
        </Card>
      )}

      {dentistProfile && (
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">
            Perfil profissional
          </h2>
          <DentistProfileForm
            initialProfile={dentistProfile}
            canWrite={canWriteDentistProfile}
          />
          {dentistHours && targetDentistId && (
            <div className="border-t border-border pt-6">
              <h3 className="font-display text-base font-semibold">
                Meus horários
              </h3>
              <div className="mt-4">
                <DentistHoursForm
                  dentistId={targetDentistId}
                  initialSchedule={dentistHours}
                  canWrite={canWriteDentistProfile}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {canManageBilling && clinic && (
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold">
            Exportação de dados (LGPD)
          </h2>
          <p className="text-sm text-muted-foreground">
            Baixe um ZIP com todos os dados da clínica em JSON e CSV.
          </p>
          <a
            href={`/api/clinics/${clinic.id}/export`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Exportar todos os dados
          </a>
        </Card>
      )}

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Conta</h2>
        <p className="text-sm text-muted-foreground">{ctx.email}</p>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </Card>

      {canManageBilling && clinic && (
        <Card className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold text-destructive">
            Encerrar conta
          </h2>
          <EncerramentoForm clinicName={clinic.name} />
        </Card>
      )}
    </div>
  );
}
