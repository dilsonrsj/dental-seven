import { NovoPacienteForm } from "@/modules/pacientes/novo-paciente-form";
import Link from "next/link";

export default function NovoPacientePage() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Novo paciente</h1>
        <Link
          href="/pacientes"
          className="text-sm text-primary hover:underline"
        >
          Voltar
        </Link>
      </div>
      <NovoPacienteForm />
    </div>
  );
}
