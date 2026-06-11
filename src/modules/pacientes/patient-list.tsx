import Link from "next/link";
import { Button, Card, CardContent, Input } from "@/components/ui";
import type { Patient } from "@/lib/supabase/types";

type PatientListProps = {
  patients: Patient[];
  search?: string;
};

export function PatientList({ patients, search = "" }: PatientListProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Pacientes demo</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Pacientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Busque por nome, telefone ou WhatsApp para abrir a ficha.
          </p>
        </div>

        <form className="flex w-full gap-2 sm:max-w-md" action="/pacientes">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Buscar paciente"
            aria-label="Buscar paciente"
          />
          <Button type="submit">Buscar</Button>
        </form>
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
