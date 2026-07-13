"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { portugueseProseFieldProps } from "@/lib/i18n/prose-field";
import type { AppointmentStatus, Dentist, Patient } from "@/lib/supabase/types";
import {
  OTHER_PROCEDURE_VALUE,
  resolveAgendaProcedureFields,
  type AgendaCatalogProcedure,
} from "@/modules/procedimentos/agenda-procedure";
import type {
  AppointmentFormInput,
  AppointmentWithRelations,
  InsurancePlanChoice,
} from "./types";
import {
  resolveInsurancePlanSelection,
  resolvePatientInsuranceDefaults,
} from "./insurance-defaults";

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

type AppointmentModalProps = {
  open: boolean;
  appointment: AppointmentWithRelations | null;
  dentists: Dentist[];
  patients: Patient[];
  catalogProcedures?: AgendaCatalogProcedure[];
  insurancePlans?: InsurancePlanChoice[];
  primaryPlanByPatient?: Record<string, string>;
  selectedDate: Date;
  initialPatientId?: string;
  onClose: () => void;
  onSubmit: (input: AppointmentFormInput) => Promise<void>;
  onStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
  isSaving?: boolean;
};

type FormState = {
  patient_id: string;
  dentist_id: string;
  starts_at: string;
  duration_min: string;
  procedure_selection: string;
  procedure_id: string | null;
  procedure_label: string;
  status: AppointmentStatus;
  notes: string;
  payment_source: "particular" | "insurance";
  insurance_plan_id: string;
};

export function AppointmentModal({
  open,
  appointment,
  dentists,
  patients,
  catalogProcedures = [],
  insurancePlans = [],
  primaryPlanByPatient = {},
  selectedDate,
  initialPatientId,
  onClose,
  onSubmit,
  onStatusChange,
  isSaving = false,
}: AppointmentModalProps) {
  const hasCatalog = catalogProcedures.length > 0;
  const hasInsurance = insurancePlans.length > 0;
  const activePlanIds = useMemo(
    () => insurancePlans.map((plan) => plan.plan_id),
    [insurancePlans],
  );

  const [form, setForm] = useState<FormState>(() =>
    buildAppointmentInitialForm(
      appointment,
      selectedDate,
      dentists,
      patients,
      catalogProcedures,
      initialPatientId,
      primaryPlanByPatient,
      activePlanIds,
    ),
  );

  useEffect(() => {
    if (!open) return;
    setForm(
      buildAppointmentInitialForm(
        appointment,
        selectedDate,
        dentists,
        patients,
        catalogProcedures,
        initialPatientId,
        primaryPlanByPatient,
        activePlanIds,
      ),
    );
  }, [
    activePlanIds,
    appointment,
    catalogProcedures,
    dentists,
    initialPatientId,
    open,
    patients,
    primaryPlanByPatient,
    selectedDate,
  ]);

  function handleProcedureSelectionChange(selection: string) {
    if (!hasCatalog) return;

    if (selection === OTHER_PROCEDURE_VALUE) {
      setForm((current) => ({
        ...current,
        procedure_selection: selection,
        procedure_id: null,
      }));
      return;
    }

    const resolved = resolveAgendaProcedureFields(
      selection,
      selection,
      catalogProcedures,
    );

    setForm((current) => ({
      ...current,
      procedure_selection: selection,
      procedure_id: resolved.procedure_id,
      procedure_label: resolved.procedure_label,
      duration_min:
        resolved.duration_min !== undefined
          ? String(resolved.duration_min)
          : current.duration_min,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let procedureId = form.procedure_id;
    let procedureLabel = form.procedure_label;

    if (hasCatalog) {
      const resolved = resolveAgendaProcedureFields(
        form.procedure_selection,
        form.procedure_selection === OTHER_PROCEDURE_VALUE
          ? form.procedure_label
          : form.procedure_selection,
        catalogProcedures,
      );
      procedureId = resolved.procedure_id;
      procedureLabel = resolved.procedure_label;
    }

    const insurancePlanId =
      form.payment_source === "insurance"
        ? resolveInsurancePlanSelection(form.insurance_plan_id, activePlanIds) ||
          null
        : null;

    await onSubmit({
      id: appointment?.id,
      patient_id: form.patient_id,
      dentist_id: form.dentist_id,
      starts_at: form.starts_at,
      duration_min: Number(form.duration_min),
      procedure_id: hasCatalog ? procedureId : undefined,
      procedure_label: procedureLabel,
      status: form.status,
      notes: form.notes,
      payment_source: form.payment_source,
      insurance_plan_id: insurancePlanId,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment ? "Editar consulta" : "Nova consulta"}
      className="max-h-[90vh] overflow-y-auto"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Paciente</span>
          <select
            required
            value={form.patient_id}
            onChange={(event) => {
              const patientId = event.target.value;
              setForm((current) => {
                if (appointment) {
                  return { ...current, patient_id: patientId };
                }
                const insurance = resolvePatientInsuranceDefaults(
                  patientId,
                  primaryPlanByPatient,
                  activePlanIds,
                );
                return { ...current, patient_id: patientId, ...insurance };
              });
            }}
            className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Dentista</span>
          <select
            required
            value={form.dentist_id}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                dentist_id: event.target.value,
              }))
            }
            className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>
                {dentist.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Data e horário</span>
            <Input
              required
              type="datetime-local"
              value={form.starts_at}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  starts_at: event.target.value,
                }))
              }
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Duração</span>
            <select
              value={form.duration_min}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  duration_min: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Procedimento</span>
          {hasCatalog ? (
            <div className="space-y-2">
              <select
                required
                value={form.procedure_selection}
                onChange={(event) =>
                  handleProcedureSelectionChange(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {catalogProcedures.map((procedure) => (
                  <option key={procedure.id} value={procedure.id}>
                    {procedure.name}
                  </option>
                ))}
                <option value={OTHER_PROCEDURE_VALUE}>
                  Outro (texto livre)
                </option>
              </select>

              {form.procedure_selection === OTHER_PROCEDURE_VALUE ? (
                <Input
                  required
                  value={form.procedure_label}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      procedure_label: event.target.value,
                    }))
                  }
                  placeholder="Consulta, limpeza, retorno..."
                />
              ) : null}
            </div>
          ) : (
            <Input
              required
              value={form.procedure_label}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  procedure_label: event.target.value,
                }))
              }
              placeholder="Consulta, limpeza, retorno..."
            />
          )}
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Status</span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as AppointmentStatus,
              }))
            }
            className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {hasInsurance && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Forma de pagamento</span>
              <select
                value={form.payment_source}
                onChange={(event) => {
                  const payment_source = event.target
                    .value as FormState["payment_source"];
                  setForm((current) => ({
                    ...current,
                    payment_source,
                    insurance_plan_id:
                      payment_source === "insurance"
                        ? resolveInsurancePlanSelection(
                            current.insurance_plan_id,
                            activePlanIds,
                          )
                        : "",
                  }));
                }}
                className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="particular">Particular</option>
                <option value="insurance">Convênio</option>
              </select>
            </label>

            {form.payment_source === "insurance" && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Plano</span>
                <select
                  required
                  value={form.insurance_plan_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      insurance_plan_id: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {insurancePlans.map((plan) => (
                    <option key={plan.plan_id} value={plan.plan_id}>
                      {plan.carrier_name} — {plan.plan_name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Observações</span>
          <textarea
            {...portugueseProseFieldProps}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            rows={3}
            className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Opcional"
          />
        </label>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
          {appointment ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving}
                onClick={() => onStatusChange(appointment.id, "confirmed")}
              >
                Confirmar
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving}
                onClick={() => onStatusChange(appointment.id, "cancelled")}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button type="submit" disabled={isSaving}>
              Salvar
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function buildAppointmentInitialForm(
  appointment: AppointmentWithRelations | null,
  selectedDate: Date,
  dentists: Dentist[],
  patients: Patient[],
  catalogProcedures: AgendaCatalogProcedure[] = [],
  initialPatientId?: string,
  primaryPlanByPatient: Record<string, string> = {},
  activePlanIds: readonly string[] = [],
): FormState {
  const initialPatientExists = patients.some(
    (patient) => patient.id === initialPatientId,
  );
  const hasCatalog = catalogProcedures.length > 0;
  const procedureId = appointment?.procedure_id ?? null;
  const procedureLabel = appointment?.procedure_label ?? "Consulta";
  const catalogMatch =
    procedureId &&
    catalogProcedures.find((procedure) => procedure.id === procedureId);

  let procedureSelection = OTHER_PROCEDURE_VALUE;
  if (hasCatalog) {
    procedureSelection = catalogMatch
      ? catalogMatch.id
      : OTHER_PROCEDURE_VALUE;
  }

  const patientId =
    appointment?.patient_id ??
    (initialPatientExists ? initialPatientId : undefined) ??
    patients[0]?.id ??
    "";

  const insuranceDefaults = appointment
    ? {
        payment_source: appointment.payment_source ?? "particular",
        insurance_plan_id: appointment.insurance_plan_id ?? "",
      }
    : resolvePatientInsuranceDefaults(
        patientId,
        primaryPlanByPatient,
        activePlanIds,
      );

  return {
    patient_id: patientId,
    dentist_id: appointment?.dentist_id ?? dentists[0]?.id ?? "",
    starts_at: formatDateTimeInput(
      appointment ? new Date(appointment.starts_at) : selectedDate,
    ),
    duration_min: String(appointment?.duration_min ?? 30),
    procedure_selection: procedureSelection,
    procedure_id: catalogMatch ? catalogMatch.id : null,
    procedure_label: procedureLabel,
    status: appointment?.status ?? "pending",
    notes: appointment?.notes ?? "",
    payment_source: insuranceDefaults.payment_source,
    insurance_plan_id: insuranceDefaults.insurance_plan_id,
  };
}

function formatDateTimeInput(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours() || 8).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}
