export const MVP_MODULES = [
  {
    title: "Agenda",
    description:
      "Visão semanal e “Hoje”, criar e editar consultas, filtro por dentista. Ideal no celular entre atendimentos.",
    status: "demo" as const,
  },
  {
    title: "Pacientes",
    description:
      "Lista com busca, ficha com anotações e histórico de consultas da Clínica Sorriso Norte (dados fictícios).",
    status: "demo" as const,
  },
  {
    title: "WhatsApp",
    description:
      "Inbox simulada com confirmação, reagendamento e lembrete. Na versão final: número real da clínica.",
    status: "demo" as const,
  },
];

export const FUTURE_MODULES = [
  {
    title: "WhatsApp real",
    description:
      "Número da clínica, confirmação e lembrete automáticos, resposta ao paciente pelo app.",
    plan: "Conecta+",
  },
  {
    title: "Prontuário",
    description:
      "Documentos, evolução por consulta, receita, atestado e envio ao paciente.",
    plan: "Completo",
  },
  {
    title: "Procedimentos",
    description: "Catálogo da clínica e procedimento vinculado à consulta.",
    plan: "Completo",
  },
  {
    title: "Estoque",
    description: "Alertas de insumo e baixa automática ao concluir procedimento.",
    plan: "Completo",
  },
  {
    title: "Financeiro",
    description: "Receita, custos e visão da operação para o dono da clínica.",
    plan: "Completo",
  },
  {
    title: "Agente IA",
    description:
      "Secretária virtual 24h no WhatsApp: agenda, responde dúvidas e passa para o dentista quando necessário.",
    plan: "Inteligente",
  },
];

export type PlanCard = {
  name: string;
  price: string;
  tagline: string;
  description: string;
  features: string[];
  addsFromPrevious?: string;
  highlight: boolean;
};

export const PLANS: PlanCard[] = [
  {
    name: "Essencial",
    price: "R$ 99",
    tagline: "Agenda + Pacientes",
    description:
      "Para o dentista que quer sair do caderno e da planilha. Organiza a rotina clínica no celular ou no computador.",
    features: [
      "Agenda semanal e visão “Hoje”",
      "Criar, editar, confirmar e cancelar consultas",
      "Cadastro e ficha do paciente com anotações",
      "Histórico de consultas por paciente",
      "1 dentista incluso",
    ],
    highlight: false,
  },
  {
    name: "Conecta",
    price: "R$ 149",
    tagline: "Essencial + WhatsApp",
    description:
      "Centraliza o atendimento ao paciente no WhatsApp da clínica — sem usar o celular pessoal do dentista.",
    features: [
      "Tudo do plano Essencial",
      "Inbox WhatsApp unificado por paciente",
      "Templates: confirmar, reagendar e lembrete",
      "Resposta manual pelo app",
      "Número dedicado da clínica (versão final)",
      "Até 3 dentistas",
    ],
    addsFromPrevious: "Inclui WhatsApp real da clínica",
    highlight: false,
  },
  {
    name: "Inteligente",
    price: "R$ 279",
    tagline: "Conecta + Agente IA",
    description:
      "Secretária virtual no WhatsApp: atende, tira dúvidas e agenda consultas 24h. O dentista assume a conversa quando quiser.",
    features: [
      "Tudo do plano Conecta",
      "Agente IA de atendimento e agendamento",
      "FAQ personalizado da clínica (base de conhecimento)",
      "Handoff: dentista entra na conversa pelo inbox",
      "Tom de voz configurável pela clínica",
      "Até 3 dentistas",
    ],
    addsFromPrevious: "Inclui agente IA no WhatsApp — diferencial DR7",
    highlight: true,
  },
  {
    name: "Completo",
    price: "R$ 349",
    tagline: "Inteligente + gestão da clínica",
    description:
      "Clínica ponta a ponta no mesmo sistema: atendimento inteligente, prontuário, insumos e visão financeira.",
    features: [
      "Tudo do plano Inteligente",
      "Prontuário eletrônico (documentos, evolução, receita e atestado)",
      "Catálogo de procedimentos com insumos por procedimento",
      "Estoque com alertas e baixa automática",
      "Módulo financeiro (receita e operação)",
      "5 GB de armazenamento de arquivos",
      "Até 3 dentistas",
    ],
    addsFromPrevious:
      "Inclui prontuário, procedimentos, estoque e financeiro",
    highlight: false,
  },
];

export const DEMO_VS_PRODUCT = [
  { today: "Senha única de demonstração", future: "Login por clínica (sua conta)" },
  { today: "Dados fictícios (Sorriso Norte)", future: "Dados reais da sua clínica" },
  { today: "WhatsApp simulado", future: "WhatsApp real da clínica" },
  { today: "3 módulos para explorar", future: "Até 8 módulos conforme plano" },
];

export const DEMO_STEPS = [
  "Entre com a senha abaixo em “Acessar demo”",
  "Explore a Agenda — teste Semana e Hoje",
  "Abra Pacientes — busque “Marina” e veja a ficha",
  "No WhatsApp — abra uma conversa e use “Confirmar”",
  "Repita no celular para sentir o uso entre consultas",
];
