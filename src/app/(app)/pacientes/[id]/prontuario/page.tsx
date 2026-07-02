import Link from "next/link";
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={`/pacientes/${id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Voltar para ficha
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            Prontuário — {patient.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Documentos importados e histórico externo do paciente.
          </p>
        </div>
      </div>

      <DocumentList patientId={id} initialDocuments={documents} />
    </div>
  );
}
