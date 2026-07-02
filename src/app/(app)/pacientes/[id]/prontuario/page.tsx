import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { getPatient } from "@/modules/pacientes/actions";
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

  const documents = await listPatientDocuments(id);

  return <DocumentList patientId={id} initialDocuments={documents} />;
}
