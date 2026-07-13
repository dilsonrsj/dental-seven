import { sendEmail } from "@/lib/email/send";
import type { ParsedBetaFeedback } from "@/modules/feedback/validation";

const DEFAULT_NOTIFY_TO = "dilsonramos@dr7performance.com.br";

export type FeedbackNotifyPayload = ParsedBetaFeedback & {
  clinicName: string;
  authorName: string;
  authorEmail: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MODULE_LABEL: Record<ParsedBetaFeedback["topModule"], string> = {
  agenda: "Agenda",
  pacientes: "Pacientes",
  prontuario: "Prontuário",
  outro: "Outro",
};

const WOULD_USE_LABEL: Record<ParsedBetaFeedback["wouldUseToday"], string> = {
  yes: "Sim",
  maybe: "Talvez",
  no: "Não",
};

function buildHtml(payload: FeedbackNotifyPayload): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `<p>Olá, Dilson.</p>
<p>Novo <strong>feedback da beta</strong> (Dental Seven).</p>
<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
  <tr><td><strong>Clínica</strong></td><td>${escapeHtml(payload.clinicName)}</td></tr>
  <tr><td><strong>Autor</strong></td><td>${escapeHtml(payload.authorName)} &lt;${escapeHtml(payload.authorEmail)}&gt;</td></tr>
  <tr><td><strong>NPS</strong></td><td>${payload.nps}</td></tr>
  <tr><td><strong>Módulo</strong></td><td>${MODULE_LABEL[payload.topModule]}</td></tr>
  <tr><td><strong>Usaria hoje</strong></td><td>${WOULD_USE_LABEL[payload.wouldUseToday]}</td></tr>
</table>
<p><strong>O que mais gostou:</strong></p>
<p style="margin:0 0 12px;padding:12px;background:#f4f4f5;border-radius:8px;">${escapeHtml(payload.likedMost)}</p>
<p><strong>O que mais travou ou faltou:</strong></p>
<p style="margin:0 0 12px;padding:12px;background:#f4f4f5;border-radius:8px;">${escapeHtml(payload.blockedOrMissing)}</p>
${
  payload.notes
    ? `<p><strong>Observações:</strong></p><p style="margin:0 0 12px;padding:12px;background:#f4f4f5;border-radius:8px;">${escapeHtml(payload.notes)}</p>`
    : ""
}
<p style="font-size:12px;color:#666;">Registro em <code>beta_feedback</code></p>
<p><a href="${appUrl}/admin/founding">Abrir Founding / Feedbacks</a></p>`;
}

export async function notifyBetaFeedback(
  payload: FeedbackNotifyPayload,
): Promise<void> {
  const to = process.env.FOUNDING_NOTIFY_TO?.trim() || DEFAULT_NOTIFY_TO;

  try {
    await sendEmail({
      to,
      subject: `[Dental Seven Beta Feedback] NPS ${payload.nps} — ${payload.clinicName}`,
      html: buildHtml(payload),
    });
  } catch (err) {
    console.error("[feedback:notify]", err);
  }
}
