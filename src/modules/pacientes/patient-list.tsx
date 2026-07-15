"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import type { Patient } from "@/lib/supabase/types";
import { PatientSearchField } from "./patient-search-field";

type PatientListProps = {
  patients: Patient[];
  search?: string;
};

export function PatientList({ patients, search = "" }: PatientListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Pacientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite para ver sugestões ou busque por nome, telefone ou WhatsApp.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
          <PatientSearchField initialSearch={search} />
          <Link
            href="/pacientes/novo"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Novo
          </Link>
        </div>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum paciente encontrado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {patients.map((patient) => (
            <Link key={patient.id} href={`/pacientes/${patient.id}`}>
              <Card className="h-full hover:bg-primary/5">
                <CardContent className="space-y-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold">
                      {patient.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {formatBirthDate(patient.birth_date)}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Telefone: </span>
                      {patient.phone ?? "Não informado"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">WhatsApp: </span>
                      {patient.whatsapp ?? "Não informado"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatBirthDate(value: string | null) {
  if (!value) return "Nascimento não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
