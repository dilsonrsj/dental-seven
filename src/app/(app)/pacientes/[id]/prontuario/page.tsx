import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { getPatient, getPatientAppointments } from "@/modules/pacientes/actions";
import { listPatientClinicalNotes } from "@/modules/prontuario/clinical-notes-actions";
import { ClinicalNotes } from "@/modules/prontuario/clinical-notes";
import { DocumentList } from "@/modules/prontuario/document-list";
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

  const [documents, notes, appointments] = await Promise.all([
    listPatientDocuments(id),
    listPatientClinicalNotes(id),
    getPatientAppointments(id),
  ]);

  const canWrite =
    !!ctx.clinic &&
    !isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role);

  return (
    <div className="space-y-6">
      <ClinicalNotes
        patientId={id}
        initialNotes={notes}
        recentAppointments={appointments.slice(0, 20)}
        canWrite={canWrite}
      />
      <DocumentList patientId={id} initialDocuments={documents} />
    </div>
  );
}
