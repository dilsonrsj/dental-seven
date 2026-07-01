type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM ?? "Dental Seven <noreply@dentalseven.app>";

  if (!apiKey) {
    console.info("[email:stub]", input.to, input.subject);
    return { ok: true, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend: ${response.status} ${body}`);
  }

  return { ok: true };
}
