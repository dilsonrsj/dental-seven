/** Link público para a spec comercial oficial (preços §3.4). */
export const PRICING_SPEC_PATH =
  "docs/superpowers/specs/2026-06-15-estrategia-modularidade-billing-ia.md";

export const PRICING_SPEC_GITHUB_URL =
  "https://github.com/dilsonrsj/dental-seven/blob/main/docs/superpowers/specs/2026-06-15-estrategia-modularidade-billing-ia.md#34-preços-oficiais--aprovados-2026-06-15";

export const PRICING_RULES = {
  trialDays: 7,
  dentistsIncluded: {
    essencial: 1,
    conectaPlus: 3,
  },
  extraDentistMonthly: "R$ 20",
} as const;
