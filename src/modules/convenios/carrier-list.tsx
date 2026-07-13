"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, Input, Modal, toast } from "@/components/ui";
import {
  createCarrier,
  createPlan,
  setCarrierActive,
  setPlanActive,
  updateCarrier,
  updatePlan,
} from "./actions";
import type { InsuranceCarrierWithPlans, InsurancePlanRow } from "./types";

type CarrierListProps = {
  initialCarriers: InsuranceCarrierWithPlans[];
  readOnly?: boolean;
};

const inputWrap = "block space-y-1.5";
const labelText = "text-sm text-muted-foreground";

export function CarrierList({
  initialCarriers,
  readOnly = false,
}: CarrierListProps) {
  const [carriers] = useState(initialCarriers);
  const [carrierModal, setCarrierModal] = useState(false);
  const [editingCarrier, setEditingCarrier] =
    useState<InsuranceCarrierWithPlans | null>(null);
  const [planModal, setPlanModal] = useState<{
    carrierId: string;
    plan: InsurancePlanRow | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function refresh() {
    // Server actions revalidate the route; a full refresh keeps the list in sync.
    window.location.reload();
  }

  async function handleToggleCarrier(carrier: InsuranceCarrierWithPlans) {
    try {
      setIsSaving(true);
      await setCarrierActive(carrier.id, !carrier.is_active);
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsSaving(false);
    }
  }

  async function handleTogglePlan(plan: InsurancePlanRow) {
    try {
      setIsSaving(true);
      await setPlanActive(plan.id, !plan.is_active);
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!readOnly && (
          <Button
            type="button"
            onClick={() => {
              setEditingCarrier(null);
              setCarrierModal(true);
            }}
          >
            Nova operadora
          </Button>
        )}
      </div>

      {carriers.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma operadora cadastrada. Comece adicionando a operadora
              (ex.: Odontoprev, Uniodonto) e depois os planos credenciados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {carriers.map((carrier) => (
            <li key={carrier.id}>
              <Card>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">
                          {carrier.name}
                        </h3>
                        {!carrier.is_active && (
                          <Badge className="border-border text-muted-foreground">
                            Inativa
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {carrier.provider_code
                          ? `Cód. prestador: ${carrier.provider_code}`
                          : "Sem código de prestador"}
                        {carrier.ans_registry
                          ? ` · ANS ${carrier.ans_registry}`
                          : ""}
                      </p>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingCarrier(carrier);
                            setCarrierModal(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isSaving}
                          onClick={() => void handleToggleCarrier(carrier)}
                        >
                          {carrier.is_active ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Planos</span>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setPlanModal({ carrierId: carrier.id, plan: null })
                          }
                        >
                          + Plano
                        </Button>
                      )}
                    </div>
                    {carrier.plans.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhum plano cadastrado nesta operadora.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {carrier.plans.map((plan) => (
                          <li
                            key={plan.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              {plan.name}
                              {plan.requires_pre_auth && (
                                <Badge>Pré-autorização</Badge>
                              )}
                              {!plan.is_active && (
                                <Badge className="border-border text-muted-foreground">
                                  Inativo
                                </Badge>
                              )}
                            </span>
                            {!readOnly && (
                              <span className="flex gap-2">
                                <button
                                  type="button"
                                  className="text-xs text-primary hover:underline"
                                  onClick={() =>
                                    setPlanModal({
                                      carrierId: carrier.id,
                                      plan,
                                    })
                                  }
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                                  disabled={isSaving}
                                  onClick={() => void handleTogglePlan(plan)}
                                >
                                  {plan.is_active ? "Desativar" : "Ativar"}
                                </button>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CarrierModal
        open={carrierModal}
        carrier={editingCarrier}
        onClose={() => setCarrierModal(false)}
        onSaved={() => void refresh()}
      />

      {planModal && (
        <PlanModal
          open={!!planModal}
          carrierId={planModal.carrierId}
          plan={planModal.plan}
          onClose={() => setPlanModal(null)}
          onSaved={() => void refresh()}
        />
      )}
    </div>
  );

  function CarrierModal({
    open,
    carrier,
    onClose,
    onSaved,
  }: {
    open: boolean;
    carrier: InsuranceCarrierWithPlans | null;
    onClose: () => void;
    onSaved: () => void;
  }) {
    const [name, setName] = useState(carrier?.name ?? "");
    const [providerCode, setProviderCode] = useState(
      carrier?.provider_code ?? "",
    );
    const [ansRegistry, setAnsRegistry] = useState(carrier?.ans_registry ?? "");
    const [portalUrl, setPortalUrl] = useState(carrier?.portal_url ?? "");
    const [notes, setNotes] = useState(carrier?.notes ?? "");
    const [saving, setSaving] = useState(false);

    async function submit(event: React.FormEvent) {
      event.preventDefault();
      try {
        setSaving(true);
        const payload = {
          name,
          provider_code: providerCode,
          ans_registry: ansRegistry,
          portal_url: portalUrl,
          notes,
        };
        if (carrier) {
          await updateCarrier(carrier.id, payload);
        } else {
          await createCarrier(payload);
        }
        toast.success("Operadora salva.");
        onClose();
        onSaved();
      } catch (error) {
        toast.error(getErrorMessage(error));
        setSaving(false);
      }
    }

    return (
      <Modal
        open={open}
        onClose={onClose}
        title={carrier ? "Editar operadora" : "Nova operadora"}
      >
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <label className={inputWrap}>
            <span className={labelText}>Nome*</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className={inputWrap}>
            <span className={labelText}>Código de prestador</span>
            <Input
              value={providerCode}
              onChange={(e) => setProviderCode(e.target.value)}
            />
          </label>
          <label className={inputWrap}>
            <span className={labelText}>Registro ANS</span>
            <Input
              value={ansRegistry}
              onChange={(e) => setAnsRegistry(e.target.value)}
            />
          </label>
          <label className={inputWrap}>
            <span className={labelText}>Portal do prestador (URL)</span>
            <Input
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
              placeholder="https://"
            />
          </label>
          <label className={inputWrap}>
            <span className={labelText}>Observações</span>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
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

  function PlanModal({
    open,
    carrierId,
    plan,
    onClose,
    onSaved,
  }: {
    open: boolean;
    carrierId: string;
    plan: InsurancePlanRow | null;
    onClose: () => void;
    onSaved: () => void;
  }) {
    const [name, setName] = useState(plan?.name ?? "");
    const [requiresPreAuth, setRequiresPreAuth] = useState(
      plan?.requires_pre_auth ?? false,
    );
    const [coverageNotes, setCoverageNotes] = useState(
      plan?.coverage_notes ?? "",
    );
    const [saving, setSaving] = useState(false);

    async function submit(event: React.FormEvent) {
      event.preventDefault();
      try {
        setSaving(true);
        if (plan) {
          await updatePlan(plan.id, {
            name,
            requires_pre_auth: requiresPreAuth,
            coverage_notes: coverageNotes,
          });
        } else {
          await createPlan({
            carrier_id: carrierId,
            name,
            requires_pre_auth: requiresPreAuth,
            coverage_notes: coverageNotes,
          });
        }
        toast.success("Plano salvo.");
        onClose();
        onSaved();
      } catch (error) {
        toast.error(getErrorMessage(error));
        setSaving(false);
      }
    }

    return (
      <Modal
        open={open}
        onClose={onClose}
        title={plan ? "Editar plano" : "Novo plano"}
      >
        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          <label className={inputWrap}>
            <span className={labelText}>Nome do plano*</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              checked={requiresPreAuth}
              onChange={(e) => setRequiresPreAuth(e.target.checked)}
              className="h-5 w-5 rounded border-border accent-[var(--primary)]"
            />
            <span className="text-sm font-medium">Exige pré-autorização</span>
          </label>
          <label className={inputWrap}>
            <span className={labelText}>Diretrizes de cobertura</span>
            <Input
              value={coverageNotes}
              onChange={(e) => setCoverageNotes(e.target.value)}
              placeholder="Regras livres da operadora"
            />
          </label>
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
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível salvar.";
}
