import { sendEmail } from "@/lib/email/send";

const DEFAULT_NOTIFY_TO = "dilsonramos@dr7performance.com.br";

export type FoundingNotifyPayload = {
  fullName: string;
  clinicName: string;
  city: string;
  state: string;
  whatsapp: string;
  email: string;
  dentistCount: string;
  currentSystem: string | null;
  mainPain: string;
  inviteRef: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhatsapp(digits: string): string {
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return digits;
}

function buildFoundingNotifyHtml(payload: FoundingNotifyPayload): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const whatsappDigits = payload.whatsapp.replace(/\D/g, "");
  const whatsappDisplay = formatWhatsapp(whatsappDigits);
  const whatsappLink = whatsappDigits
    ? `https://wa.me/55${whatsappDigits}`
    : null;

  return `<p>Olá, Dilson.</p>
<p>Novo cadastro no programa <strong>Founding Members</strong> (Dental Seven beta).</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
  <tr><td><strong>Nome</strong></td><td>${escapeHtml(payload.fullName)}</td></tr>
  <tr><td><strong>Clínica</strong></td><td>${escapeHtml(payload.clinicName)}</td></tr>
  <tr><td><strong>Cidade/UF</strong></td><td>${escapeHtml(payload.city)} / ${escapeHtml(payload.state)}</td></tr>
  <tr><td><strong>E-mail</strong></td><td><a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></td></tr>
  <tr><td><strong>WhatsApp</strong></td><td>${whatsappLink ? `<a href="${whatsappLink}">${escapeHtml(whatsappDisplay)}</a>` : escapeHtml(whatsappDisplay)}</td></tr>
  <tr><td><strong>Dentistas</strong></td><td>${escapeHtml(payload.dentistCount)}</td></tr>
  <tr><td><strong>Sistema atual</strong></td><td>${escapeHtml(payload.currentSystem ?? "—")}</td></tr>
  <tr><td><strong>Ref. convite</strong></td><td>${escapeHtml(payload.inviteRef ?? "—")}</td></tr>
</table>
<p><strong>O que mais atrapalha hoje:</strong></p>
<p style="margin:0 0 16px;padding:12px;background:#f4f4f5;border-radius:8px;">${escapeHtml(payload.mainPain)}</p>
<p style="font-size:12px;color:#666;">Registro salvo em <code>beta_founders</code> · Supabase Dental Seven</p>
<p><a href="${appUrl}/admin">Abrir Super Admin</a></p>`;
}

export async function notifyFoundingSubmission(
  payload: FoundingNotifyPayload,
): Promise<void> {
  const to =
    process.env.FOUNDING_NOTIFY_TO?.trim() || DEFAULT_NOTIFY_TO;

  try {
    await sendEmail({
      to,
      subject: `[Dental Seven Beta] ${payload.clinicName} — ${payload.fullName}`,
      html: buildFoundingNotifyHtml(payload),
    });
  } catch (err) {
    console.error("[founding:notify]", err);
  }
}
