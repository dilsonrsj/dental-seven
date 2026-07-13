export const BETA_FEEDBACK_TOP_MODULES = [
  "agenda",
  "pacientes",
  "prontuario",
  "outro",
] as const;

export type BetaFeedbackTopModule = (typeof BETA_FEEDBACK_TOP_MODULES)[number];

export const BETA_FEEDBACK_WOULD_USE = ["yes", "maybe", "no"] as const;

export type BetaFeedbackWouldUse = (typeof BETA_FEEDBACK_WOULD_USE)[number];

export type BetaFeedbackInput = {
  nps: number;
  topModule: BetaFeedbackTopModule;
  likedMost: string;
  blockedOrMissing: string;
  wouldUseToday: BetaFeedbackWouldUse;
  notes?: string | null;
};

export type ParsedBetaFeedback = {
  nps: number;
  topModule: BetaFeedbackTopModule;
  likedMost: string;
  blockedOrMissing: string;
  wouldUseToday: BetaFeedbackWouldUse;
  notes: string | null;
};

export type ParseBetaFeedbackResult =
  | { ok: true; data: ParsedBetaFeedback }
  | { ok: false; error: string };

const MAX_SHORT = 500;
const MAX_NOTES = 2000;

function isTopModule(value: unknown): value is BetaFeedbackTopModule {
  return (
    typeof value === "string" &&
    (BETA_FEEDBACK_TOP_MODULES as readonly string[]).includes(value)
  );
}

function isWouldUse(value: unknown): value is BetaFeedbackWouldUse {
  return (
    typeof value === "string" &&
    (BETA_FEEDBACK_WOULD_USE as readonly string[]).includes(value)
  );
}

export function parseBetaFeedbackInput(
  input: BetaFeedbackInput,
): ParseBetaFeedbackResult {
  if (
    typeof input.nps !== "number" ||
    !Number.isInteger(input.nps) ||
    input.nps < 0 ||
    input.nps > 10
  ) {
    return { ok: false, error: "Informe uma nota de 0 a 10." };
  }

  if (!isTopModule(input.topModule)) {
    return { ok: false, error: "Selecione o módulo que mais usou." };
  }

  const likedMost = input.likedMost.trim();
  if (likedMost.length < 2) {
    return { ok: false, error: "Conte o que mais gostou (mín. 2 caracteres)." };
  }
  if (likedMost.length > MAX_SHORT) {
    return { ok: false, error: `“O que mais gostou” deve ter no máximo ${MAX_SHORT} caracteres.` };
  }

  const blockedOrMissing = input.blockedOrMissing.trim();
  if (blockedOrMissing.length < 2) {
    return {
      ok: false,
      error: "Conte o que mais travou ou faltou (mín. 2 caracteres).",
    };
  }
  if (blockedOrMissing.length > MAX_SHORT) {
    return {
      ok: false,
      error: `“O que mais travou” deve ter no máximo ${MAX_SHORT} caracteres.`,
    };
  }

  if (!isWouldUse(input.wouldUseToday)) {
    return {
      ok: false,
      error: "Informe se usaria no consultório real hoje.",
    };
  }

  const notesRaw = (input.notes ?? "").trim();
  if (notesRaw.length > MAX_NOTES) {
    return {
      ok: false,
      error: `Observações gerais devem ter no máximo ${MAX_NOTES} caracteres.`,
    };
  }

  return {
    ok: true,
    data: {
      nps: input.nps,
      topModule: input.topModule,
      likedMost,
      blockedOrMissing,
      wouldUseToday: input.wouldUseToday,
      notes: notesRaw.length > 0 ? notesRaw : null,
    },
  };
}
