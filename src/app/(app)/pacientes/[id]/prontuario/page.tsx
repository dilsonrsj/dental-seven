import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { getPatient, getPatientAppointments } from "@/modules/pacientes/actions";
import { listPatientClinicalNotes } from "@/modules/prontuario/clinical-notes-actions";
import { listPatientToothRecords } from "@/modules/prontuario/odontogram/actions/tooth-actions";
import { ProntuarioContent } from "@/modules/prontuario/prontuario-content";
import { listPatientDocuments } from "@/modules/prontuario/actions";

type ProntuarioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProntuarioPage({ params }: ProntuarioPageProps) {
  const { id } = await params;
  const ctx = await getAuthContext();

  if (!ctx) redirect("/entrar");
  if (!ctx.enabledModules.includes("prontuario")) {
    redirect(`/pacientes/${id}`);
  }

  const patient = await getPatient(id);
  if (!patient) notFound();

  const [documents, notes, toothRecords, appointments] = await Promise.all([
    listPatientDocuments(id),
    listPatientClinicalNotes(id),
    listPatientToothRecords(id),
    getPatientAppointments(id),
  ]);

  const canWrite =
    !!ctx.clinic &&
    !isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role);

  return (
    <ProntuarioContent
      patientId={id}
      initialDocuments={documents}
      initialNotes={notes}
      initialToothRecords={toothRecords}
      recentAppointments={appointments.slice(0, 20)}
      canWrite={canWrite}
    />
  );
}
