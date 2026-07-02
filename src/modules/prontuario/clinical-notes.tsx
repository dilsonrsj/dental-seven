"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, toast } from "@/components/ui";
import type { PatientAppointmentWithRelations } from "@/modules/pacientes/types";
import { createPatientClinicalNote } from "./clinical-notes-actions";
import type { PatientClinicalNoteListItem } from "./types";

const textareaClassName =
  "flex min-h-[120px] w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

type ClinicalNotesProps = {
  patientId: string;
  initialNotes: PatientClinicalNoteListItem[];
  recentAppointments: PatientAppointmentWithRelations[];
  canWrite: boolean;
};

export function ClinicalNotes({
  patientId,
  initialNotes,
  recentAppointments,
  canWrite,
}: ClinicalNotesProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) return;

    try {
      setIsSaving(true);
      const created = await createPatientClinicalNote(
        patientId,
        body,
        appointmentId || null,
      );
      setNotes((current) => [created, ...current]);
      setBody("");
      setAppointmentId("");
      toast.success("Evolução registrada.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Evolução clínica</h2>
            <p className="text-sm text-muted-foreground">
              Registros cronológicos do atendimento. Vincule a uma consulta quando
              fizer sentido.
            </p>
          </div>

          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Descreva a evolução clínica do paciente..."
              className={textareaClassName}
              disabled={!canWrite || isSaving}
              required
            />

            {recentAppointments.length > 0 && (
              <label className="block space-y-1.5">
                <span className="text-sm text-muted-foreground">
                  Consulta vinculada (opcional)
                </span>
                <select
                  value={appointmentId}
                  onChange={(event) => setAppointmentId(event.target.value)}
                  disabled={!canWrite || isSaving}
                  className="flex h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Sem vínculo</option>
                  {recentAppointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      {formatAppointmentOption(appointment)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {!canWrite && (
              <p className="text-sm text-amber-400">
                Assinatura inativa — leitura permitida, mas novos registros estão
                bloqueados.
              </p>
            )}

            <Button type="submit" disabled={!canWrite || isSaving || !body.trim()}>
              {isSaving ? "Salvando..." : "Registrar evolução"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Histórico</h2>
            <p className="text-sm text-muted-foreground">
              {notes.length} registro(s) neste prontuário.
            </p>
          </div>

          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma evolução registrada ainda.
            </p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(note.created_at)}
                      {note.author_name ? ` · ${note.author_name}` : ""}
                    </p>
                    {note.appointment_label && (
                      <p className="text-xs text-primary">{note.appointment_label}</p>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{note.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatAppointmentOption(appointment: PatientAppointmentWithRelations) {
  const date = new Date(appointment.starts_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dentist = appointment.dentist?.name ?? "Dentista";
  return `${date} — ${appointment.procedure_label} (${dentist})`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível salvar a evolução.";
}
