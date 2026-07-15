"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  SearchableCombobox,
  toast,
} from "@/components/ui";
import {
  deletePatientEnrollment,
  savePatientEnrollment,
} from "./actions";
import type { InsurancePlanOption, PatientEnrollmentRow } from "./types";

type PatientInsuranceSectionProps = {
  patientId: string;
  initialEnrollments: PatientEnrollmentRow[];
  planOptions: InsurancePlanOption[];
  canWrite: boolean;
};

export function PatientInsuranceSection({
  patientId,
  initialEnrollments,
  planOptions,
  canWrite,
}: PatientInsuranceSectionProps) {
  const [enrollments] = useState(initialEnrollments);
  const [modalOpen, setModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    try {
      setRemovingId(id);
      await deletePatientEnrollment(id, patientId);
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setRemovingId(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Plano odontológico
            </h2>
            <p className="text-sm text-muted-foreground">
              Convênios do paciente (carteirinha, titular e validade).
            </p>
          </div>
          {canWrite && planOptions.length > 0 && (
            <Button type="button" onClick={() => setModalOpen(true)}>
              Vincular plano
            </Button>
          )}
        </div>

        {planOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum plano ativo cadastrado. Cadastre operadoras e planos em
            Convênios antes de vincular ao paciente.
          </p>
        ) : enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Paciente sem plano vinculado — atendimento particular.
          </p>
        ) : (
          <ul className="space-y-2">
            {enrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background p-3"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {enrollment.carrier_name} — {enrollment.plan_name}
                    {enrollment.is_primary && <Badge>Principal</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Carteirinha: {enrollment.card_number}
                    {enrollment.holder_name
                      ? ` · Titular: ${enrollment.holder_name}`
                      : ""}
                    {enrollment.valid_until
                      ? ` · Validade: ${formatDate(enrollment.valid_until)}`
                      : ""}
                  </p>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline disabled:opacity-50"
                    disabled={removingId === enrollment.id}
                    onClick={() => void handleRemove(enrollment.id)}
                  >
                    Remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {modalOpen && (
        <EnrollmentModal
          patientId={patientId}
          planOptions={planOptions}
          onClose={() => setModalOpen(false)}
        />
      )}
    </Card>
  );
}

function EnrollmentModal({
  patientId,
  planOptions,
  onClose,
}: {
  patientId: string;
  planOptions: InsurancePlanOption[];
  onClose: () => void;
}) {
  const [planId, setPlanId] = useState(planOptions[0]?.plan_id ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [saving, setSaving] = useState(false);
  const planComboboxOptions = useMemo(
    () =>
      planOptions.map((option) => ({
        value: option.plan_id,
        label: `${option.carrier_name} — ${option.plan_name}`,
      })),
    [planOptions],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      await savePatientEnrollment({
        patient_id: patientId,
        plan_id: planId,
        card_number: cardNumber,
        holder_name: holderName,
        valid_until: validUntil || null,
        is_primary: isPrimary,
      });
      toast.success("Plano vinculado.");
      onClose();
      window.location.reload();
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Vincular plano">
      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <div className="space-y-1.5">
          <span className="text-sm text-muted-foreground">Plano</span>
          <SearchableCombobox
            value={planId}
            onChange={setPlanId}
            options={planComboboxOptions}
            placeholder="Digite a operadora ou plano"
            aria-label="Buscar plano"
            required
          />
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">Nº da carteirinha*</span>
          <Input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">
            Titular (se dependente)
          </span>
          <Input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-muted-foreground">Validade</span>
          <Input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="h-5 w-5 rounded border-border accent-[var(--primary)]"
          />
          <span className="text-sm font-medium">Plano principal</span>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível salvar.";
}
