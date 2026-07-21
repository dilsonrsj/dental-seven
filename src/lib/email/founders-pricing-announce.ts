import { sendEmail } from "@/lib/email/send";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildFoundersPricingAnnouncementHtml(fullName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dental-seven-self.vercel.app";
  const first = fullName.trim().split(/\s+/)[0] || "olá";

  return `<p>Olá, ${escapeHtml(first)}.</p>
<p>Atualizamos a <strong>precificação Founding Members</strong> do Dental Seven e já está na capa da beta.</p>
<p><strong>Como funciona agora:</strong></p>
<ul>
  <li>O <strong>valor de lista</strong> aparece sempre (referência do plano).</li>
  <li>Como founding member, do plano <strong>Conecta para cima</strong>, a condição é o <strong>anual com 25% de desconto em 12×</strong>.</li>
  <li>Exemplo âncora — <strong>Conecta</strong>: lista R$&nbsp;187,00 → founding <strong>12× de R$&nbsp;140,25</strong> (total R$&nbsp;1.683,00).</li>
</ul>
<p>Inteligente e Completo seguem a mesma lógica (lista −25% em 12×). O Essencial continua como entrada da tabela; a condição founding em 12× começa no Conecta.</p>
<p>No lançamento público (landing oficial), a oferta será a mensalidade promocional — isso ainda não está na vitrine pública.</p>
<p><a href="${appUrl}/founding">Ver a tabela na capa da beta</a></p>
<p style="font-size:12px;color:#666;">Dental Seven · DR7 Performance · Programa Founding Members</p>`;
}

export async function notifyFounderPricingAnnouncement(input: {
  to: string;
  fullName: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  return sendEmail({
    to: input.to,
    subject: "Dental Seven — precificação Founding Members publicada",
    html: buildFoundersPricingAnnouncementHtml(input.fullName),
  });
}
