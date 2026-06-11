import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui";
import {
  getPatient,
  getPatientAppointments,
  isSupabaseConfigured,
} from "@/modules/pacientes/actions";
import { PatientDetail } from "@/modules/pacientes/patient-detail";

type PacienteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PacienteDetailPage({
  params,
}: PacienteDetailPageProps) {
  const { id } = await params;

  if (!(await isSupabaseConfigured())) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Paciente
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

  const [patient, appointments] = await Promise.all([
    getPatient(id),
    getPatientAppointments(id),
  ]);

  if (!patient) notFound();

  return <PatientDetail patient={patient} appointments={appointments} />;
}
