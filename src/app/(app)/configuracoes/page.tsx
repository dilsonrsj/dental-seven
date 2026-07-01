import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { signOut } from "@/lib/auth/actions";
import {
  createBillingSubscription,
  linkAsaasCustomer,
} from "@/lib/billing/actions";
import { isAsaasConfigured } from "@/lib/billing/asaas";
import { PLAN_LABELS, PLAN_PRICES } from "@/lib/billing/plans";
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
        {canManageBilling && !asaasReady && (
          <p className="text-xs text-muted-foreground">
            Configure ASAAS_API_KEY para ativar cobrança automática no 8º dia.
          </p>
        )}
      </Card>

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
