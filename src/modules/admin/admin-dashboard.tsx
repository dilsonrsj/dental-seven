"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { PLAN_LABELS } from "@/lib/billing/plans";
import { adminAuditActionLabel } from "@/modules/admin/admin-audit-labels";
import type { AdminActionKind, AdminDashboardData, FairUseLevel } from "@/modules/admin/types";

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

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function actionKindLabel(kind: AdminActionKind): string {
  switch (kind) {
    case "trial_expiring":
      return "Trial";
    case "past_due":
      return "Past due";
    case "founder_pending_signup":
      return "Founding";
    case "clinic_no_adoption":
      return "Adoção";
    case "fair_use_alert":
      return "Fair use";
  }
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
  actionQueue,
  recentAudit,
  newClinics,
  foundingSummary,
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
        <CardTitle className="text-lg">Ação necessária hoje</CardTitle>
        <Card>
          {actionQueue.length === 0 ? (
            <CardContent className="py-5 text-sm text-muted-foreground">
              Nenhuma ação pendente no momento.
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {actionQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-border text-muted-foreground">
                        {actionKindLabel(item.kind)}
                      </Badge>
                      <p className="font-medium">{item.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver detalhe →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">Founding Members</CardTitle>
          <Link
            href="/admin/founding"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver pipeline completo →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">Total founders</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {foundingSummary.totalFounders}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">Novos em 7 dias</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {foundingSummary.newFoundersLast7Days}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">Conversão p/ clínica</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {foundingSummary.conversionRate}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <p className="text-sm text-muted-foreground">Top indicação</p>
              <p className="mt-1 font-display text-lg font-semibold">
                {foundingSummary.topInviteRefs[0]
                  ? `${foundingSummary.topInviteRefs[0].ref} (${foundingSummary.topInviteRefs[0].count})`
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <CardTitle className="text-lg">Novos cadastros (7 dias)</CardTitle>
        <Card>
          {newClinics.length === 0 ? (
            <CardContent className="py-5 text-sm text-muted-foreground">
              Nenhuma clínica nova nos últimos 7 dias.
            </CardContent>
          ) : (
            <div className="ds-table-shell">
              <table className="ds-table">
                <thead className="bg-surface text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Clínica</th>
                    <th className="px-4 py-3 font-medium">Plano</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Criada em</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {newClinics.map((clinic) => (
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
                      <td className="px-4 py-3">{clinic.subscription_status}</td>
                      <td className="px-4 py-3">
                        {formatDate(clinic.created_at)}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">Atividade recente</CardTitle>
          <Link
            href="/admin/auditoria"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver auditoria completa →
          </Link>
        </div>
        <Card>
          {recentAudit.length === 0 ? (
            <CardContent className="py-5 text-sm text-muted-foreground">
              Nenhuma ação registrada ainda.
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {recentAudit.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {adminAuditActionLabel(row.action)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {row.actor_name}
                      {row.clinic_name ? ` · ${row.clinic_name}` : ""}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <CardTitle className="text-lg">Trials expirando em 7 dias</CardTitle>
        <Card>
          {trialsExpiring.length === 0 ? (
            <CardContent className="py-5 text-sm text-muted-foreground">
              Nenhum trial expira nos próximos 7 dias.
            </CardContent>
          ) : (
            <div className="ds-table-shell">
              <table className="ds-table">
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
            <div className="ds-table-shell">
              <table className="ds-table">
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
          href="/admin/founding"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver founding members →
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
