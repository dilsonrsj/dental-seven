"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClinicSession } from "@/contexts/clinic-session-context";

type PatientRecordHeaderProps = {
  patientId: string;
  patientName: string;
};

export function PatientRecordHeader({
  patientId,
  patientName,
}: PatientRecordHeaderProps) {
  const pathname = usePathname();
  const { enabledModules } = useClinicSession();
  const showProntuario = enabledModules.includes("prontuario");

  const infoHref = `/pacientes/${patientId}`;
  const prontuarioHref = `/pacientes/${patientId}/prontuario`;
  const isProntuario = pathname.startsWith(prontuarioHref);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/pacientes"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voltar para pacientes
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
            {patientName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isProntuario
              ? "Documentos importados e histórico externo do paciente."
              : "Ficha do paciente e histórico de consultas."}
          </p>
        </div>
        <Link
          href={`/agenda?patientId=${patientId}`}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,oklch(0.63_0.15_250),oklch(0.55_0.17_250))] px-4 font-display text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:shadow-[0_0_40px_-10px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
        >
          Nova consulta
        </Link>
      </div>

      {showProntuario && (
        <nav
          className="flex gap-2 rounded-2xl border border-border bg-surface p-1"
          aria-label="Seções da ficha do paciente"
        >
          <TabLink href={infoHref} active={!isProntuario}>
            Informações
          </TabLink>
          <TabLink href={prontuarioHref} active={isProntuario}>
            Prontuário
          </TabLink>
        </nav>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-background hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
