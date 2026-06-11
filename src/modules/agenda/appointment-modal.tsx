"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Modal } from "@/components/ui";
import type { AppointmentStatus, Dentist, Patient } from "@/lib/supabase/types";
import type { AppointmentFormInput, AppointmentWithRelations } from "./types";

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
  procedure_label: string;
  status: AppointmentStatus;
  notes: string;
};

export function AppointmentModal({
  open,
  appointment,
  dentists,
  patients,
  selectedDate,
  initialPatientId,
  onClose,
  onSubmit,
  onStatusChange,
  isSaving = false,
}: AppointmentModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    buildAppointmentInitialForm(
      appointment,
      selectedDate,
      dentists,
      patients,
      initialPatientId,
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
        initialPatientId,
      ),
    );
  }, [appointment, dentists, initialPatientId, open, patients, selectedDate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      id: appointment?.id,
      patient_id: form.patient_id,
      dentist_id: form.dentist_id,
      starts_at: form.starts_at,
      duration_min: Number(form.duration_min),
      procedure_label: form.procedure_label,
      status: form.status,
      notes: form.notes,
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
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                patient_id: event.target.value,
              }))
            }
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

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Observações</span>
          <textarea
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
  initialPatientId?: string,
): FormState {
  const initialPatientExists = patients.some(
    (patient) => patient.id === initialPatientId,
  );

  return {
    patient_id:
      appointment?.patient_id ??
      (initialPatientExists ? initialPatientId : undefined) ??
      patients[0]?.id ??
      "",
    dentist_id: appointment?.dentist_id ?? dentists[0]?.id ?? "",
    starts_at: formatDateTimeInput(
      appointment ? new Date(appointment.starts_at) : selectedDate,
    ),
    duration_min: String(appointment?.duration_min ?? 30),
    procedure_label: appointment?.procedure_label ?? "Consulta",
    status: appointment?.status ?? "pending",
    notes: appointment?.notes ?? "",
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
