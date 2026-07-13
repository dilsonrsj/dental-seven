export const FOUNDING_COOKIE = "founding_access";

/** Fim oficial da beta Founding Members (decisão Dilson — 13/07/2026). */
export const BETA_ENDS_AT = "2026-08-07";
export const BETA_ENDS_LABEL = "07 de agosto de 2026";
export const BETA_ENDS_SHORT = "07/08/2026";

/** Frase canônica pós-encerramento da beta (banner + founding). */
export const BETA_POST_END_MESSAGE =
  "Após essa data, o acesso beta termina e abrimos a condição exclusiva de founding member (desconto nos primeiros meses).";

export const BRAZILIAN_STATES = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
] as const;

export const FOUNDING_CONTENT = {
  eyebrow: "Programa Founding Members · Versão beta",
  headline: "Você foi convidado(a) a testar o Dental Seven",
  subheadline:
    "A DR7 Performance selecionou um grupo reduzido de dentistas para usar a plataforma antes do lançamento público. Sua opinião vai orientar o que priorizamos nos próximos meses.",
  welcome:
    "Não precisa ser perfeito — precisa ser real. Use no consultório, anote o que funcionou e o que travou, e nos conte. Em troca, você entra na lista de lançamento com condição exclusiva de founding member.",
  betaWindow: {
    title: "Até quando a beta fica no ar",
    body: `A versão beta do programa Founding Members fica disponível até ${BETA_ENDS_LABEL}. ${BETA_POST_END_MESSAGE} WhatsApp real e IA entram na versão de produção.`,
  },

  betaNote: {
    title: "O que esta versão beta inclui",
    includes: [
      "Agenda, pacientes e equipe no celular",
      "Prontuário, anamnese e odontograma interativo",
      "Procedimentos, estoque e financeiro (conforme plano)",
      "Trial de 7 dias sem cartão",
    ],
    comingSoon: [
      "WhatsApp automático com pacientes (produção — após a beta)",
      "Agente de IA no atendimento (produção — após a beta)",
    ],
  },
  expectations: {
    title: "O que pedimos de você",
    items: [
      "Usar a plataforma pelo menos 2 vezes por semana durante a beta",
      "Cadastrar um paciente ou simular sua rotina real de consultório",
      "Testar agenda + prontuário/odontograma no celular",
      `Enviar feedback até ${BETA_ENDS_SHORT} (formulário in-app ou WhatsApp)`,
    ],
  },
  benefit: {
    title: "Benefício founding member",
    body: `Desconto exclusivo nos primeiros meses após o lançamento oficial e aviso com 48h de antecedência antes do público geral. A beta encerra em ${BETA_ENDS_SHORT}. ${BETA_POST_END_MESSAGE}`,
  },

  formTitle: "Confirme seus dados para liberar o acesso",
  ctaDisabled: "Preencha o formulário para liberar o acesso",
  ctaEnabled: "Acessar a plataforma",
  successTitle: "Tudo certo — acesso liberado",
  successBody:
    "Obrigado por confirmar. Crie sua clínica na próxima etapa e comece a explorar. Estamos acompanhando de perto.",
  whatsappFallback:
    "Problemas no formulário? Fale com a DR7 no WhatsApp: (79) 99836-4822",
} as const;

export const FEEDBACK_WHATSAPP =
  "https://wa.me/5579998364822?text=Ol%C3%A1%2C%20sou%20founding%20member%20do%20Dental%20Seven%20e%20quero%20enviar%20feedback%20sobre%20a%20beta.";
