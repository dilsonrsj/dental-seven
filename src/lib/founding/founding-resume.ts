export function normalizeWhatsappDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export type FoundingResumeResult =
  | { ok: true }
  | { ok: false; error: string };

/** Returning founding email must confirm the same WhatsApp. */
export function assertFoundingResumeAllowed(
  submittedWhatsapp: string,
  storedWhatsapp: string,
): FoundingResumeResult {
  const submitted = normalizeWhatsappDigits(submittedWhatsapp);
  const stored = normalizeWhatsappDigits(storedWhatsapp);

  if (!stored || submitted !== stored) {
    return {
      ok: false,
      error:
        "Este e-mail já está na lista Founding. Confirme o mesmo WhatsApp do cadastro ou fale com a DR7.",
    };
  }

  return { ok: true };
}
