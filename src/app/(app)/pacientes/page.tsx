import { getPatients } from "@/modules/pacientes/actions";
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

  const patients = await getPatients(search);

  return <PatientList patients={patients} search={search} />;
}
