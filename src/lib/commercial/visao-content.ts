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
      "Inbox simulada com confirmação, reagendamento e lembrete. Na versão final: número real da clínica (plano Completo).",
    status: "demo" as const,
  },
];

export const FUTURE_MODULES = [
  {
    title: "Prontuário",
    description:
      "Documentos, evolução por consulta, receita, atestado e envio ao paciente.",
    plan: "Conecta+",
  },
  {
    title: "Procedimentos",
    description: "Catálogo da clínica e procedimento vinculado à consulta.",
    plan: "Conecta+",
  },
  {
    title: "Estoque",
    description: "Alertas de insumo e baixa automática ao concluir procedimento.",
    plan: "Inteligente+",
  },
  {
    title: "Financeiro",
    description: "Receita, custos e visão da operação para o dono da clínica.",
    plan: "Inteligente+",
  },
  {
    title: "WhatsApp real",
    description:
      "Número da clínica, confirmação e lembrete automáticos, resposta ao paciente pelo app.",
    plan: "Completo",
  },
  {
    title: "Agente IA",
    description:
      "Secretária virtual 24h no WhatsApp: agenda, responde dúvidas e passa para o dentista quando necessário.",
    plan: "Completo",
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
    tagline: "Clínica digital",
    description:
      "Prontuário e procedimentos no mesmo sistema da agenda — sem depender de papel ou planilhas.",
    features: [
      "Tudo do plano Essencial",
      "Prontuário eletrônico",
      "Catálogo de procedimentos",
      "Até 3 dentistas",
    ],
    addsFromPrevious: "Inclui prontuário e procedimentos",
    highlight: false,
  },
  {
    name: "Inteligente",
    price: "R$ 279",
    tagline: "Gestão da clínica",
    description:
      "Estoque e financeiro integrados à rotina clínica — visão da operação para quem administra a clínica.",
    features: [
      "Tudo do plano Conecta",
      "Controle de estoque com alertas",
      "Módulo financeiro (receita e operação)",
      "Até 3 dentistas",
    ],
    addsFromPrevious: "Inclui estoque e financeiro",
    highlight: true,
  },
  {
    name: "Completo",
    price: "R$ 349",
    tagline: "Atendimento completo",
    description:
      "WhatsApp da clínica, agente IA e fornecedores — clínica ponta a ponta no mesmo sistema.",
    features: [
      "Tudo do plano Inteligente",
      "Inbox WhatsApp unificado por paciente",
      "Agente IA de atendimento e agendamento",
      "Gestão de fornecedores",
      "5 GB de armazenamento de arquivos",
      "Até 3 dentistas",
    ],
    addsFromPrevious: "Inclui WhatsApp, IA e fornecedores",
    highlight: false,
  },
];

export const DEMO_VS_PRODUCT = [
  { today: "Senha única de demonstração", future: "Login por clínica (sua conta)" },
  { today: "Dados fictícios (Sorriso Norte)", future: "Dados reais da sua clínica" },
  { today: "WhatsApp simulado", future: "WhatsApp real da clínica (plano Completo)" },
  { today: "3 módulos para explorar", future: "Até 9 módulos conforme plano" },
];

export const DEMO_STEPS = [
  "Entre com a senha abaixo em “Acessar demo”",
  "Explore a Agenda — teste Semana e Hoje",
  "Abra Pacientes — busque “Marina” e veja a ficha",
  "No WhatsApp — abra uma conversa e use “Confirmar”",
  "Repita no celular para sentir o uso entre consultas",
];
