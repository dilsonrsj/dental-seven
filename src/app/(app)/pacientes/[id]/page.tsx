import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import {
  getPatient,
  getPatientAppointments,
} from "@/modules/pacientes/actions";
import { PatientDetail } from "@/modules/pacientes/patient-detail";
import {
  listActivePlanOptions,
  listPatientEnrollments,
} from "@/modules/convenios/actions";
import { PatientInsuranceSection } from "@/modules/convenios/patient-insurance-section";

type PacienteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PacienteDetailPage({
  params,
}: PacienteDetailPageProps) {
  const { id } = await params;

  const [patient, appointments, ctx] = await Promise.all([
    getPatient(id),
    getPatientAppointments(id),
    getAuthContext(),
  ]);

  if (!patient) notFound();

  const conveniosEnabled = ctx?.enabledModules.includes("convenios") ?? false;

  let insuranceSection = null;
  if (conveniosEnabled) {
    const [enrollments, planOptions] = await Promise.all([
      listPatientEnrollments(id),
      listActivePlanOptions(),
    ]);
    const canWrite =
      !!ctx?.clinic &&
      !isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role);
    insuranceSection = (
      <PatientInsuranceSection
        patientId={id}
        initialEnrollments={enrollments}
        planOptions={planOptions}
        canWrite={canWrite}
      />
    );
  }

  return (
    <>
      <PatientDetail patient={patient} appointments={appointments} />
      {insuranceSection}
    </>
  );
}
