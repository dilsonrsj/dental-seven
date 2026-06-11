"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Badge, Button, Card, CardContent, toast } from "@/components/ui";
import type { AppointmentStatus, Patient } from "@/lib/supabase/types";
import { updatePatientNotes } from "./actions";
import type { PatientAppointmentWithRelations } from "./types";

const statusLabels: Record<AppointmentStatus, string> = {
  confirmed: "Confirmada",
  pending: "Pendente",
  cancelled: "Cancelada",
  completed: "Concluída",
};

type PatientDetailProps = {
  patient: Patient;
  appointments: PatientAppointmentWithRelations[];
};

export function PatientDetail({ patient, appointments }: PatientDetailProps) {
  const [notes, setNotes] = useState(patient.notes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveNotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const updated = await updatePatientNotes(patient.id, notes);
      setNotes(updated.notes ?? "");
      toast.success("Observações salvas.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/pacientes"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voltar para pacientes
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            {patient.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ficha demo do paciente e histórico de consultas.
          </p>
        </div>
        <Link
          href={`/agenda?patientId=${patient.id}`}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,oklch(0.63_0.15_250),oklch(0.55_0.17_250))] px-4 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:shadow-[0_0_40px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
        >
          Nova consulta
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardContent className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold">
                Informações de contato
              </h2>
              <p className="text-sm text-muted-foreground">
                Dados fictícios para demonstração do MVP.
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Telefone</dt>
                <dd className="font-medium">{patient.phone ?? "Não informado"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">WhatsApp</dt>
                <dd className="font-medium">
                  {patient.whatsapp ?? "Não informado"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Nascimento</dt>
                <dd className="font-medium">
                  {formatBirthDate(patient.birth_date)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSaveNotes}>
              <div>
                <h2 className="font-display text-lg font-semibold">
                  Observações clínicas
                </h2>
                <p className="text-sm text-muted-foreground">
                  Atualize preferências, alertas e contexto do atendimento.
                </p>
              </div>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={7}
                className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="Adicione observações sobre o paciente..."
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar observações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Histórico de consultas
            </h2>
            <p className="text-sm text-muted-foreground">
              {appointments.length} consulta(s) registradas para este paciente.
            </p>
          </div>

          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta encontrada para este paciente.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Data</th>
                    <th className="py-3 pr-4 font-medium">Procedimento</th>
                    <th className="py-3 pr-4 font-medium">Dentista</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="py-3 pr-4">
                        {formatDateTime(appointment.starts_at)}
                      </td>
                      <td className="py-3 pr-4">
                        {appointment.procedure_label}
                      </td>
                      <td className="py-3 pr-4">
                        {appointment.dentist?.name ?? "Não informado"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge>{statusLabels[appointment.status]}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {appointment.notes ?? "Sem observações"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatBirthDate(value: string | null) {
  if (!value) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Erro ao salvar observações.";
}
