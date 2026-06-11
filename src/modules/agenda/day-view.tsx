"use client";

import { Button, Card, CardContent, Badge } from "@/components/ui";
import type { AppointmentStatus } from "@/lib/supabase/types";
import { getAppointmentsForDate } from "./date-utils";
import type { AppointmentWithRelations } from "./types";

const statusLabels: Record<AppointmentStatus, string> = {
  confirmed: "Confirmada",
  pending: "Pendente",
  cancelled: "Cancelada",
  completed: "Concluída",
};

type DayViewProps = {
  appointments: AppointmentWithRelations[];
  selectedDate: Date;
  onEditAppointment: (appointment: AppointmentWithRelations) => void;
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  isSaving?: boolean;
};

export function DayView({
  appointments,
  selectedDate,
  onEditAppointment,
  onStatusChange,
  isSaving = false,
}: DayViewProps) {
  const dayAppointments = getAppointmentsForDate(appointments, selectedDate);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {formatFullDate(selectedDate)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {dayAppointments.length} consulta(s) no dia selecionado.
        </p>
      </div>

      {dayAppointments.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta encontrada para este dia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dayAppointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div
                    className="mt-1 h-12 w-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        appointment.dentist?.color ?? "var(--primary)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold">
                        {formatTime(new Date(appointment.starts_at))}
                      </p>
                      <Badge>{statusLabels[appointment.status]}</Badge>
                    </div>
                    <p className="mt-1 font-medium">
                      {appointment.patient?.name ?? "Paciente não encontrado"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.procedure_label} ·{" "}
                      {appointment.dentist?.name ?? "Dentista não encontrado"} ·{" "}
                      {appointment.duration_min} min
                    </p>
                    {appointment.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onEditAppointment(appointment)}
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving || appointment.status === "confirmed"}
                    onClick={() => onStatusChange(appointment.id, "confirmed")}
                  >
                    Confirmar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving || appointment.status === "cancelled"}
                    onClick={() => onStatusChange(appointment.id, "cancelled")}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}
