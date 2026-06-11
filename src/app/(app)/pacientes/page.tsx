import { Card, CardContent } from "@/components/ui";
import { getPatients, isSupabaseConfigured } from "@/modules/pacientes/actions";
import { PatientList } from "@/modules/pacientes/patient-list";

type PacientesPageProps = {
  searchParams?: Promise<{
    search?: string | string[];
  }>;
};

export default async function PacientesPage({
  searchParams,
}: PacientesPageProps) {
  const params = await searchParams;
  const search = Array.isArray(params?.search)
    ? params?.search[0]
    : params?.search;

  if (!(await isSupabaseConfigured())) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Pacientes
        </h1>
        <Card>
          <CardContent>
            <p className="font-medium">Configure .env.local</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Defina `NEXT_PUBLIC_SUPABASE_URL` e
              `NEXT_PUBLIC_SUPABASE_ANON_KEY` para carregar os dados demo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const patients = await getPatients(search);

  return <PatientList patients={patients} search={search} />;
}
