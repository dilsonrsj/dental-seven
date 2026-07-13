import Link from "next/link";
import { FEEDBACK_WHATSAPP } from "@/lib/founding/content";
import { isBetaGateEnabled } from "@/lib/founding/gate";

const GUIDE_SECTIONS = [
  {
    title: "Agenda",
    body: "Marque consultas, navegue pela semana e filtre por dentista. Os horários respeitam a configuração da clínica e de cada profissional.",
  },
  {
    title: "Pacientes",
    body: "Cadastre a ficha, abra o prontuário e acompanhe anamnese e convênio do paciente no mesmo fluxo.",
  },
  {
    title: "Prontuário e odontograma",
    body: "No prontuário você encontra documentos clínicos e o odontograma 3D — gire a arcada, clique em um dente e veja o histórico. Em equipamentos sem WebGL, use o fallback 2D.",
  },
  {
    title: "Procedimentos",
    body: "Monte o catálogo de procedimentos e associe insumos (BOM) para baixa automática no estoque quando aplicável.",
  },
  {
    title: "Estoque",
    body: "Controle saldos, alertas de mínimo e movimentações. A baixa pode ocorrer ao registrar procedimentos vinculados.",
  },
  {
    title: "Financeiro",
    body: "Acompanhe entradas/saídas, lançamentos manuais e o reflexo financeiro dos atendimentos da clínica.",
  },
  {
    title: "Convênios",
    body: "Cadastre operadoras, tabelas de preço e acompanhe a fila de guias em status interno (fundação v8 — ainda sem TISS/GTO completa).",
  },
  {
    title: "Configurações e equipe",
    body: "Logo e contato da clínica, horários, convite de dentistas e limites do plano. Na beta, foque no que a equipe precisa para o dia a dia.",
  },
] as const;

export default function AjudaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Guia rápido
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão rápida de como usar a Dental Seven nesta versão beta. O conteúdo
          será expandido com o feedback dos testadores.
        </p>
      </header>

      <div className="space-y-6">
        {GUIDE_SECTIONS.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              {section.title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <footer className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
        <p>
          WhatsApp e agente de IA entram na produção futura (plano Completo). Na
          beta, use o app normalmente e envie feedback.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {isBetaGateEnabled() ? (
            <Link
              href="/feedback"
              className="font-medium text-primary hover:underline"
            >
              Enviar feedback
            </Link>
          ) : null}
          <Link
            href={FEEDBACK_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            WhatsApp DR7
          </Link>
        </div>
      </footer>
    </div>
  );
}
