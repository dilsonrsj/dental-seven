/**
 * Precificação comercial em duas fases.
 * Fonte: OS precificacao.md · spec 2026-07-20-precificacao-oficial.md
 */

export type PricingPlanRow = {
  key: "essencial" | "conecta" | "inteligente" | "completo";
  name: string;
  /** Valor de tabela (mensal) — coluna "Valores" */
  listLabel: string;
  /** Oferta fundadores: 12× com −25% da lista (só Conecta+) */
  foundingInstallmentLabel: string | null;
  foundingTotalLabel: string | null;
  /** Economia vs pagar a lista 12 meses */
  annualSavingsLabel: string | null;
  /** Oferta de lançamento = mensal (landing oficial, pós-beta) */
  launchOfferLabel: string;
  /** O que o plano oferece (vitrine cliente) — lista completa, sem “Tudo do…” */
  includes: string[];
};

export const PRICING_PHASE = {
  founding: "founding" as const,
  launch: "launch" as const,
};

export const PRICING_PLAN_ROWS: PricingPlanRow[] = [
  {
    key: "essencial",
    name: "Essencial",
    listLabel: "R$ 124,00",
    foundingInstallmentLabel: null,
    foundingTotalLabel: null,
    annualSavingsLabel: null,
    launchOfferLabel: "R$ 99,00",
    includes: [
      "Agenda e pacientes",
      "Prontuário + odontograma 2D + anamnese",
      "Financeiro básico",
      "Site da clínica (subdomínio)",
      "1 dentista",
      "Suporte por e-mail",
    ],
  },
  {
    key: "conecta",
    name: "Conecta",
    listLabel: "R$ 187,00",
    foundingInstallmentLabel: "R$ 140,25",
    foundingTotalLabel: "R$ 1.683,00",
    annualSavingsLabel: "R$ 561,00",
    launchOfferLabel: "R$ 150,00",
    includes: [
      "Agenda e pacientes",
      "Prontuário + odontograma 2D + anamnese",
      "Financeiro básico",
      "Site da clínica (subdomínio)",
      "Procedimentos + BOM",
      "Confirmações WhatsApp (até 300/mês)",
      "Agendamento rápido por voz (IA)",
      "Até 3 dentistas",
      "Chat de suporte na plataforma",
    ],
  },
  {
    key: "inteligente",
    name: "Inteligente",
    listLabel: "R$ 349,00",
    foundingInstallmentLabel: "R$ 261,75",
    foundingTotalLabel: "R$ 3.141,00",
    annualSavingsLabel: "R$ 1.047,00",
    launchOfferLabel: "R$ 279,00",
    includes: [
      "Agenda e pacientes",
      "Prontuário + odontograma 2D + anamnese",
      "Financeiro básico",
      "Site da clínica (subdomínio)",
      "Procedimentos + BOM",
      "Agendamento rápido por voz (IA)",
      "Estoque + fornecedores",
      "Financeiro avançado",
      "Convênios",
      "Confirmações WhatsApp (até 600/mês)",
      "Até 3 dentistas",
      "Chat de suporte na plataforma",
    ],
  },
  {
    key: "completo",
    name: "Completo",
    listLabel: "R$ 437,00",
    foundingInstallmentLabel: "R$ 327,75",
    foundingTotalLabel: "R$ 3.933,00",
    annualSavingsLabel: "R$ 1.311,00",
    launchOfferLabel: "R$ 349,00",
    includes: [
      "Agenda e pacientes",
      "Prontuário + odontograma 2D + anamnese",
      "Financeiro básico",
      "Site da clínica (subdomínio)",
      "Procedimentos + BOM",
      "Agendamento rápido por voz (IA)",
      "Estoque + fornecedores",
      "Financeiro avançado",
      "Convênios",
      "Inbox WhatsApp + IA",
      "Confirmações WhatsApp (uso clínico típico)",
      "Até 3 dentistas",
      "Chat de suporte na plataforma",
    ],
  },
];

export const FOUNDING_PRICING_COPY = {
  title: "Planos e condição de Fundadores",
  highlightPlan: "conecta" as const,
} as const;

export const LAUNCH_PRICING_COPY = {
  title: "Oferta de lançamento",
  subtitle:
    "Lista sempre visível. Oferta de lançamento = preço mensal promocional.",
  note: "Exibir só na landing page oficial do Dental Seven (pós-beta).",
} as const;
