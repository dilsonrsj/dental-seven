"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, toast } from "@/components/ui";
import { EXTRA_DENTIST_PRICE, PLAN_LABELS } from "@/lib/billing/plans";
import type { PlanKey } from "@/lib/billing/plans";
import type { DentistQuotaSummary } from "@/lib/billing/dentist-quota";
import {
  inviteDentistToClinic,
  type ClinicTeamMember,
} from "./team-actions";

type ClinicTeamFormProps = {
  members: ClinicTeamMember[];
  quota: DentistQuotaSummary;
  planKey: PlanKey;
  canWrite: boolean;
};

export function ClinicTeamForm({
  members,
  quota,
  planKey,
  canWrite,
}: ClinicTeamFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmExtraCharge, setConfirmExtraCharge] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const willBeExtra = quota.requiresExtraConfirm;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite || !quota.canAdd) return;

    try {
      setIsSaving(true);
      await inviteDentistToClinic({
        name,
        email,
        confirmExtraCharge: willBeExtra ? confirmExtraCharge : undefined,
      });
      setName("");
      setEmail("");
      setConfirmExtraCharge(false);
      toast.success("Convite enviado por e-mail.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível convidar.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-background p-4 text-sm">
        <p>
          Plano <strong>{PLAN_LABELS[planKey]}</strong> —{" "}
          {quota.active} de {quota.included} dentistas inclusos
        </p>
        {quota.extra > 0 && (
          <p className="mt-1 text-muted-foreground">
            {quota.extra} dentista(s) extra — +R$ {quota.extraMonthlyCost}/mês
          </p>
        )}
        {quota.requiresUpgrade && (
          <p className="mt-2 text-destructive">
            Limite do plano Essencial atingido. Faça upgrade para Conecta para
            adicionar mais dentistas.
          </p>
        )}
      </div>

      {members.length > 0 ? (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: member.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{member.name}</p>
                <p className="truncate text-muted-foreground">
                  {member.email ?? "Convite pendente ou sem login"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum dentista cadastrado.
        </p>
      )}

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <h3 className="font-display text-base font-semibold">Convidar dentista</h3>
        <p className="text-sm text-muted-foreground">
          Cria o profissional na agenda, copia o horário da clínica e envia
          convite de acesso por e-mail.
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">Nome</span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Dra. Ana Silva"
            disabled={!canWrite || !quota.canAdd || isSaving}
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">E-mail</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ana@clinica.com.br"
            disabled={!canWrite || !quota.canAdd || isSaving}
            required
          />
        </label>

        {willBeExtra && quota.canAdd && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmExtraCharge}
              onChange={(event) => setConfirmExtraCharge(event.target.checked)}
              disabled={!canWrite || isSaving}
              className="mt-1"
            />
            <span>
              Entendo que este dentista será cobrado como extra (+R${" "}
              {EXTRA_DENTIST_PRICE}/mês) além da mensalidade do plano.
            </span>
          </label>
        )}

        {canWrite && (
          <Button
            type="submit"
            disabled={
              isSaving ||
              !quota.canAdd ||
              (willBeExtra && !confirmExtraCharge)
            }
          >
            {isSaving ? "Enviando..." : "Enviar convite"}
          </Button>
        )}
      </form>
    </div>
  );
}
