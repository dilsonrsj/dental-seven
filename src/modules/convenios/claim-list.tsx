"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, Input, Modal, toast } from "@/components/ui";
import { brlInputToCents, centsToBrlInput, formatBrlFromCents } from "@/modules/procedimentos/price-utils";
import {
  CLAIM_STATUS_LABELS,
  listSelectableClaimStatuses,
  isGlosaStatus,
  isOpenReceivable,
} from "./claim-status";
import { markClaimPaid, updateClaimStatus } from "./actions";
import type { InsuranceClaimRow, InsuranceClaimStatus } from "./types";

type ClaimListProps = {
  initialClaims: InsuranceClaimRow[];
  glosaOnly?: boolean;
  readOnly?: boolean;
};

export function ClaimList({
  initialClaims,
  glosaOnly = false,
  readOnly = false,
}: ClaimListProps) {
  const [claims] = useState(initialClaims);
  const [statusModal, setStatusModal] = useState<InsuranceClaimRow | null>(null);
  const [payModal, setPayModal] = useState<InsuranceClaimRow | null>(null);

  const visible = glosaOnly
    ? claims.filter((claim) => isGlosaStatus(claim.status))
    : claims;

  const openReceivableCents = claims
    .filter((claim) => isOpenReceivable(claim.status))
    .reduce((sum, claim) => sum + claim.submitted_amount_cents, 0);

  return (
    <div className="space-y-4">
      {!glosaOnly && (
        <Card>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              A receber de convênios (guias em aberto)
            </span>
            <span className="font-display text-lg font-semibold">
              {formatBrlFromCents(openReceivableCents)}
            </span>
          </CardContent>
        </Card>
      )}

      {visible.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {glosaOnly
                ? "Nenhuma glosa registrada."
                : "Nenhuma guia registrada. As guias são criadas ao concluir uma consulta marcada como convênio na agenda."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visible.map((claim) => (
            <li key={claim.id}>
              <Card>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{claim.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {claim.carrier_name} — {claim.plan_name}
                      </p>
                    </div>
                    <StatusBadge status={claim.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      Enviado: {formatBrlFromCents(claim.submitted_amount_cents)}
                    </span>
                    {claim.paid_amount_cents != null && (
                      <span>Pago: {formatBrlFromCents(claim.paid_amount_cents)}</span>
                    )}
                    {claim.glosa_amount_cents != null && (
                      <span className="text-amber-400">
                        Glosa: {formatBrlFromCents(claim.glosa_amount_cents)}
                      </span>
                    )}
                  </div>

                  {claim.glosa_reason && (
                    <p className="text-xs text-amber-300">
                      Motivo: {claim.glosa_reason}
                    </p>
                  )}

                  {!readOnly && (
                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStatusModal(claim)}
                      >
                        Atualizar status
                      </Button>
                      {claim.status !== "paid" && (
                        <Button type="button" onClick={() => setPayModal(claim)}>
                          Registrar pagamento
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {statusModal && (
        <StatusModal claim={statusModal} onClose={() => setStatusModal(null)} />
      )}
      {payModal && <PayModal claim={payModal} onClose={() => setPayModal(null)} />}
    </div>
  );
}

function StatusBadge({ status }: { status: InsuranceClaimStatus }) {
  const glosa = isGlosaStatus(status);
  const paid = status === "paid";
  const className = paid
    ? "border-emerald-500/40 text-emerald-300"
    : glosa
      ? "border-amber-500/40 text-amber-300"
      : "";
  return <Badge className={className}>{CLAIM_STATUS_LABELS[status]}</Badge>;
}

function StatusModal({
  claim,
  onClose,
}: {
  claim: InsuranceClaimRow;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<InsuranceClaimStatus>(claim.status);
  const [authPassword, setAuthPassword] = useState(claim.auth_password ?? "");
  const [glosaReason, setGlosaReason] = useState(claim.glosa_reason);
  const [glosaAmount, setGlosaAmount] = useState(
    claim.glosa_amount_cents != null
      ? centsToBrlInput(claim.glosa_amount_cents)
      : "",
  );
  const [saving, setSaving] = useState(false);
  const glosa = isGlosaStatus(status);
  const statusOptions = listSelectableClaimStatuses(claim.status);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      await updateClaimStatus({
        id: claim.id,
        status,
        auth_password: authPassword,
        glosa_reason: glosa ? glosaReason : null,
        glosa_amount_cents:
          glosa && glosaAmount ? brlInputToCents(glosaAmount) : null,
      });
      toast.success("Status atualizado.");
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Atualizar guia">
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as InsuranceClaimStatus)}
            className="flex h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {CLAIM_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">
            Senha de autorização
          </span>
          <Input
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
          />
        </label>
        {glosa && (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm text-muted-foreground">Motivo da glosa</span>
              <Input
                value={glosaReason}
                onChange={(e) => setGlosaReason(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm text-muted-foreground">
                Valor glosado (R$)
              </span>
              <Input
                value={glosaAmount}
                onChange={(e) => setGlosaAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
              />
            </label>
          </>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PayModal({
  claim,
  onClose,
}: {
  claim: InsuranceClaimRow;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(
    centsToBrlInput(claim.submitted_amount_cents),
  );
  const [partial, setPartial] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      await markClaimPaid({
        id: claim.id,
        paid_amount_cents: brlInputToCents(amount || "0"),
        partial,
      });
      toast.success("Pagamento registrado.");
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Registrar pagamento">
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {claim.patient_name} · {claim.carrier_name} — {claim.plan_name}
        </p>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">Valor recebido (R$)</span>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
          />
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <input
            type="checkbox"
            checked={partial}
            onChange={(e) => setPartial(e.target.checked)}
            className="h-5 w-5 rounded border-border accent-[var(--primary)]"
          />
          <span className="text-sm font-medium">
            Pagamento parcial (houve glosa)
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          O valor recebido é lançado como receita no Financeiro (se o módulo
          estiver ativo).
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível salvar.";
}
