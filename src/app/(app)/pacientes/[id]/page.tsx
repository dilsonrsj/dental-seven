import { notFound } from "next/navigation";
import {
  getPatient,
  getPatientAppointments,
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

  const [patient, appointments] = await Promise.all([
    getPatient(id),
    getPatientAppointments(id),
  ]);

  if (!patient) notFound();

  return <PatientDetail patient={patient} appointments={appointments} />;
}
