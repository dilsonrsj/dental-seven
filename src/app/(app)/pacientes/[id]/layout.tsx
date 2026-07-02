import { notFound } from "next/navigation";
import { getPatient } from "@/modules/pacientes/actions";
import { PatientRecordHeader } from "@/modules/pacientes/patient-record-header";

type PatientLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export default async function PatientLayout({
  children,
  params,
}: PatientLayoutProps) {
  const { id } = await params;
  const patient = await getPatient(id);

  if (!patient) notFound();

  return (
    <div className="space-y-4">
      <PatientRecordHeader patientId={id} patientName={patient.name} />
      {children}
    </div>
  );
}
