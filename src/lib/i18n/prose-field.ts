/**
 * Campos de texto livre em português.
 * O corretor nativo do navegador segue o idioma do SO/navegador e costuma
 * marcar português como erro quando a UI está em inglês — desligamos para
 * evitar falsos positivos (ex.: Cursor, Windows en-US).
 */
export const portugueseProseFieldProps = {
  lang: "pt-BR",
  spellCheck: false,
  autoComplete: "off",
  autoCorrect: "off",
} as const;
