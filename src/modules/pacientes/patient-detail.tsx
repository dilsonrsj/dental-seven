"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Card, CardContent, toast } from "@/components/ui";
import { portugueseProseFieldProps } from "@/lib/i18n/prose-field";
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
                {...portugueseProseFieldProps}
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
            <>
              <div className="space-y-3 md:hidden">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {formatDateTime(appointment.starts_at)}
                      </p>
                      <Badge>{statusLabels[appointment.status]}</Badge>
                    </div>
                    <p className="mt-2 font-medium">
                      {appointment.procedure_label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointment.dentist?.name ?? "Não informado"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {appointment.notes ?? "Sem observações"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
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
            </>
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
