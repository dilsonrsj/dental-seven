"use client";

import Link from "next/link";
import { PLAN_LABELS, type PlanKey } from "@/lib/billing/plans";
type PaywallOverlayProps = {
  clinicId: string;
  planKey: PlanKey;
  status: "expired" | "past_due";
};

const linkBtn =
  "inline-flex h-14 w-full items-center justify-center rounded-xl font-display text-sm font-semibold uppercase tracking-wider";

export function PaywallOverlay({ clinicId, planKey, status }: PaywallOverlayProps) {
  const title =
    status === "past_due"
      ? "Pagamento pendente"
      : "Seu período de teste encerrou";

  const message =
    status === "past_due"
      ? "Regularize sua assinatura para continuar usando o Dental Seven."
      : "Seu trial de 7 dias terminou. Assine para continuar organizando sua clínica.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-glow">
        <h2 className="font-display text-xl font-bold text-foreground">
          {title}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        <p className="mt-2 text-sm">
          Plano: <strong>{PLAN_LABELS[planKey]}</strong>
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/configuracoes" className={`${linkBtn} bg-primary text-primary-foreground`}>
            Assinar agora
          </Link>
          <a
            href={`/api/clinics/${clinicId}/export`}
            className={`${linkBtn} border border-border text-foreground`}
          >
            Exportar meus dados
          </a>
        </div>
      </div>
    </div>
  );
}
