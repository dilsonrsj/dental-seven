"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { PLAN_LABELS } from "@/lib/billing/plans";
import type { AdminDashboardData, FairUseLevel } from "@/modules/admin/types";

type AdminDashboardProps = AdminDashboardData;

function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatPercent(percent: number | null): string {
  if (percent === null) return "—";
  return `${Math.round(percent)}%`;
}

function fairUseLevelLabel(level: FairUseLevel): string {
  if (level === "exceeded") return "Excedido";
  if (level === "warning") return "Alerta";
  return "OK";
}

function fairUseLevelClass(level: FairUseLevel): string {
  if (level === "exceeded") {
    return "border-destructive/40 text-destructive";
  }
  if (level === "warning") {
    return "border-amber-500/40 text-amber-600";
  }
  return "border-muted-foreground/30 text-muted-foreground";
}

type KpiCardProps = {
  label: string;
  value: string | number;
  valueClassName?: string;
};

function KpiCard({ label, value, valueClassName = "" }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={`mt-1 font-display text-2xl font-semibold tracking-tight ${valueClassName}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard({
  kpis,
  trialsExpiring,
  fairUseAlerts,
}: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Ativas" value={kpis.activeCount} />
        <KpiCard label="Trial" value={kpis.trialingCount} />
        <KpiCard
          label="Past due"
          value={kpis.pastDueCount}
          valueClassName={kpis.pastDueCount > 0 ? "text-amber-600" : ""}
        />
        <KpiCard label="Encerradas" value={kpis.closedCount} />
        <KpiCard
          label="MRR estimado"
          value={formatBrl(kpis.estimatedMrr)}
          valueClassName="text-emerald-600"
        />
      </div>

      <section className="space-y-3">
        <CardTitle className="text-lg">Trials expirando em 7 dias</CardTitle>
        <Card>
          {trialsExpiring.length === 0 ? (
            <CardContent className="py-5 text-sm text-muted-foreground">
              Nenhum trial expira nos próximos 7 dias.
            </CardContent>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Clínica</th>
                    <th className="px-4 py-3 font-medium">Plano</th>
                    <th className="px-4 py-3 font-medium">Expira em</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {trialsExpiring.map((clinic) => (
                    <tr key={clinic.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium">{clinic.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {clinic.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {PLAN_LABELS[clinic.plan_key]}
                      </td>
                      <td className="px-4 py-3">
                        {clinic.trial_ends_at
                          ? formatDate(clinic.trial_ends_at)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/clinicas/${clinic.id}`}
                          className="text-primary hover:underline"
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <CardTitle className="text-lg">Alertas fair use (≥ 80%)</CardTitle>
        <Card>
          {fairUseAlerts.length === 0 ? (
            <CardContent className="py-5 text-sm text-muted-foreground">
              Nenhuma clínica com uso acima de 80% no mês atual.
            </CardContent>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Clínica</th>
                    <th className="px-4 py-3 font-medium">Plano</th>
                    <th className="px-4 py-3 font-medium">WhatsApp</th>
                    <th className="px-4 py-3 font-medium">IA</th>
                    <th className="px-4 py-3 font-medium">Nível</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {fairUseAlerts.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {PLAN_LABELS[row.plan_key]}
                      </td>
                      <td className="px-4 py-3">
                        {formatPercent(row.fairUse.whatsapp.percent)}
                      </td>
                      <td className="px-4 py-3">
                        {formatPercent(row.fairUse.ai.percent)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={fairUseLevelClass(row.fairUseLevel)}>
                          {fairUseLevelLabel(row.fairUseLevel)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/clinicas/${row.id}`}
                          className="text-primary hover:underline"
                        >
                          Ver ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin/clinicas"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver todas as clínicas →
        </Link>
        <Link
          href="/agenda"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Voltar ao app
        </Link>
      </div>
    </div>
  );
}
