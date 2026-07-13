import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import { getPatient } from "@/modules/pacientes/actions";
import { getPatientAnamnesis } from "@/modules/anamnese/anamnesis-actions";
import { AnamnesisForm } from "@/modules/anamnese/anamnesis-form";

type AnamnesePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AnamnesePage({ params }: AnamnesePageProps) {
  const { id } = await params;
  const ctx = await getAuthContext();

  if (!ctx) redirect("/entrar");
  if (!ctx.enabledModules.includes("prontuario")) {
    redirect(`/pacientes/${id}`);
  }

  const patient = await getPatient(id);
  if (!patient) notFound();

  const anamnesis = await getPatientAnamnesis(id);

  const canWrite =
    !!ctx.clinic &&
    !isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role);

  return (
    <AnamnesisForm
      patientId={id}
      initialResponses={anamnesis?.responses ?? null}
      canWrite={canWrite}
    />
  );
}
