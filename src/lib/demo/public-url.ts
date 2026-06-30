/** URL pública da demo em produção (Vercel). */
export const DEMO_PUBLIC_BASE_URL = "https://dental-seven-self.vercel.app";

export const DEMO_PUBLIC_URLS = {
  home: DEMO_PUBLIC_BASE_URL,
  entrar: `${DEMO_PUBLIC_BASE_URL}/entrar`,
  visao: `${DEMO_PUBLIC_BASE_URL}/visao`,
} as const;
