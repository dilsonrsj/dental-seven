"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ModuleToggleList } from "@/app/admin/clinicas/[id]/module-toggle-list";
import {
  extendClinicTrial,
  logClinicExportRequest,
  setClinicSubscriptionStatus,
  setClinicWhatsAppThrottled,
  startClinicImpersonation,
  updateClinicAdminNotes,
  updateClinicPlan,
} from "@/lib/admin/actions";
import { PLAN_LABELS, type PlanKey } from "@/lib/billing/plans";
import { portugueseProseFieldProps } from "@/lib/i18n/prose-field";
import type { SubscriptionStatus } from "@/lib/billing/subscription";
import type {
  ClinicDetailForAdmin,
  FairUseLevel,
  FairUseMetric,
} from "@/modules/admin/types";

type ClinicDetailProps = ClinicDetailForAdmin;

type TabKey = "resumo" | "uso" | "modulos" | "billing" | "acoes";

const PLAN_KEYS: PlanKey[] = ["essencial", "conecta", "inteligente", "completo"];

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trial",
  active: "Ativa",
  past_due: "Suspensa",
  expired: "Expirada",
  canceled: "Encerrada",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
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

function fairUseBarClass(level: FairUseLevel): string {
  if (level === "exceeded") return "bg-destructive";
  if (level === "warning") return "bg-amber-500";
  return "bg-primary";
}

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

type FairUseBarProps = {
  label: string;
  metric: FairUseMetric;
};

function FairUseBar({ label, metric }: FairUseBarProps) {
  const widthPercent =
    metric.percent === null ? 0 : Math.min(metric.percent, 100);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {metric.cap !== null ? (
            <span className="text-muted-foreground">
              {metric.usage.toLocaleString("pt-BR")} /{" "}
              {metric.cap.toLocaleString("pt-BR")}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {metric.usage.toLocaleString("pt-BR")} (sem cap)
            </span>
          )}
          <Badge className={fairUseLevelClass(metric.level)}>
            {fairUseLevelLabel(metric.level)}
          </Badge>
        </div>
      </div>
      {metric.cap !== null ? (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${fairUseBarClass(metric.level)}`}
            style={{ width: `${widthPercent}%` }}
          />
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Uso: {formatPercent(metric.percent)}
      </p>
    </div>
  );
}

type DetailRowProps = {
  label: string;
  value: ReactNode;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export function ClinicDetail({
  clinic,
  modules,
  webhookEvents,
  storageBytes,
  yearMonth,
}: ClinicDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("resumo");
  const [exporting, setExporting] = useState(false);

  const isSuspended = clinic.subscription_status === "past_due";
  const canSuspend =
    clinic.subscription_status === "active" ||
    clinic.subscription_status === "trialing";
  const canReactivate = clinic.subscription_status === "past_due";

  async function handleExport() {
    setExporting(true);
    try {
      await logClinicExportRequest(clinic.id);
      window.location.href = `/api/clinics/${clinic.id}/export`;
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/clinicas"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Clínicas
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{clinic.name}</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {clinic.slug}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{PLAN_LABELS[clinic.plan_key]}</Badge>
            <Badge className="capitalize">{STATUS_LABELS[clinic.subscription_status]}</Badge>
            {clinic.deleted_at ? (
              <Badge className="border-destructive/40 text-destructive">
                Encerrada
              </Badge>
            ) : null}
            {clinic.whatsapp_throttled ? (
              <Badge className="border-amber-500/40 text-amber-600">
                WhatsApp throttled
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton
          active={activeTab === "resumo"}
          onClick={() => setActiveTab("resumo")}
        >
          Resumo
        </TabButton>
        <TabButton
          active={activeTab === "uso"}
          onClick={() => setActiveTab("uso")}
        >
          Uso
        </TabButton>
        <TabButton
          active={activeTab === "modulos"}
          onClick={() => setActiveTab("modulos")}
        >
          Módulos
        </TabButton>
        <TabButton
          active={activeTab === "billing"}
          onClick={() => setActiveTab("billing")}
        >
          Billing
        </TabButton>
        <TabButton
          active={activeTab === "acoes"}
          onClick={() => setActiveTab("acoes")}
        >
          Ações
        </TabButton>
      </div>

      {activeTab === "resumo" ? (
        <Card>
          <CardContent className="space-y-4 py-5">
            <CardTitle className="text-base">Identidade</CardTitle>
            <dl className="space-y-3">
              <DetailRow label="ID" value={clinic.id} />
              <DetailRow label="Slug" value={clinic.slug} />
              <DetailRow
                label="Plano"
                value={PLAN_LABELS[clinic.plan_key]}
              />
              <DetailRow
                label="Status"
                value={STATUS_LABELS[clinic.subscription_status]}
              />
              <DetailRow
                label="Trial até"
                value={
                  clinic.trial_ends_at
                    ? formatDate(clinic.trial_ends_at)
                    : "—"
                }
              />
              <DetailRow
                label="Criada em"
                value={formatDate(clinic.created_at)}
              />
            </dl>

            <form
              action={async (formData) => {
                const notes = formData.get("adminNotes")?.toString() ?? "";
                await updateClinicAdminNotes(clinic.id, notes);
              }}
              className="space-y-3 border-t border-border pt-4"
            >
              <CardTitle className="text-base">Notas internas DR7</CardTitle>
              <textarea
                {...portugueseProseFieldProps}
                name="adminNotes"
                defaultValue={clinic.admin_notes ?? ""}
                rows={4}
                placeholder="Observações internas visíveis apenas no SuperAdmin…"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              />
              <Button type="submit" variant="outline" size="md">
                Salvar notas
              </Button>
            </form>

            <form
              action={async (formData) => {
                const throttled = formData.get("whatsappThrottled") === "on";
                await setClinicWhatsAppThrottled(clinic.id, throttled);
              }}
              className="space-y-3 border-t border-border pt-4"
            >
              <CardTitle className="text-base">WhatsApp throttle</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quando ativo, limita envios WhatsApp na fase de integração real.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="whatsappThrottled"
                  defaultChecked={clinic.whatsapp_throttled}
                  className="size-4 rounded border-border"
                />
                WhatsApp throttled
              </label>
              <Button type="submit" variant="outline" size="md">
                Salvar throttle
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "uso" ? (
        <Card>
          <CardContent className="space-y-6 py-5">
            <div>
              <CardTitle className="text-base">Fair use</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Mês de referência: {yearMonth}
              </p>
            </div>
            <FairUseBar label="WhatsApp (conv./mês)" metric={clinic.fairUse.whatsapp} />
            <FairUseBar label="IA (respostas/mês)" metric={clinic.fairUse.ai} />
            <div className="border-t border-border pt-4">
              <DetailRow label="Storage" value={formatBytes(storageBytes)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "modulos" ? (
        <section className="space-y-3">
          <CardTitle className="text-lg">Módulos</CardTitle>
          <ModuleToggleList clinicId={clinic.id} modules={modules} />
        </section>
      ) : null}

      {activeTab === "billing" ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 py-5">
              <CardTitle className="text-base">Asaas</CardTitle>
              <dl className="space-y-3">
                <DetailRow
                  label="Customer ID"
                  value={clinic.asaas_customer_id ?? "—"}
                />
                <DetailRow
                  label="Subscription ID"
                  value={clinic.asaas_subscription_id ?? "—"}
                />
              </dl>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <CardTitle className="text-lg">Últimos webhooks</CardTitle>
            <Card>
              {webhookEvents.length === 0 ? (
                <CardContent className="py-5 text-sm text-muted-foreground">
                  Nenhum evento registrado para esta clínica.
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Evento</th>
                        <th className="px-4 py-3 font-medium">Quando</th>
                        <th className="px-4 py-3 font-medium">Payload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhookEvents.map((event) => (
                        <tr key={event.id} className="border-t border-border">
                          <td className="px-4 py-3 font-mono text-xs">
                            {event.event_type}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDate(event.created_at)}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                            {JSON.stringify(event.payload)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </section>
        </div>
      ) : null}

      {activeTab === "acoes" ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 py-5">
              <CardTitle className="text-base">Alterar plano</CardTitle>
              <form
                action={async (formData) => {
                  const planKey = formData.get("planKey") as PlanKey;
                  await updateClinicPlan(clinic.id, planKey);
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">Plano</span>
                  <select
                    name="planKey"
                    defaultValue={clinic.plan_key}
                    className="rounded-xl border border-border bg-surface px-3 py-2"
                  >
                    {PLAN_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {PLAN_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="submit" variant="outline" size="md">
                  Salvar plano
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-5">
              <CardTitle className="text-base">Estender trial</CardTitle>
              <form
                action={async (formData) => {
                  const days = Number(formData.get("extraDays"));
                  await extendClinicTrial(clinic.id, days);
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">Dias adicionais</span>
                  <input
                    type="number"
                    name="extraDays"
                    min={1}
                    defaultValue={7}
                    className="w-28 rounded-xl border border-border bg-surface px-3 py-2"
                  />
                </label>
                <Button type="submit" variant="outline" size="md">
                  Estender trial
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-5">
              <CardTitle className="text-base">Assinatura</CardTitle>
              <div className="flex flex-wrap gap-3">
                {canSuspend ? (
                  <form
                    action={setClinicSubscriptionStatus.bind(
                      null,
                      clinic.id,
                      "past_due",
                    )}
                  >
                    <Button type="submit" variant="outline" size="md">
                      Suspender clínica
                    </Button>
                  </form>
                ) : null}
                {canReactivate ? (
                  <form
                    action={setClinicSubscriptionStatus.bind(
                      null,
                      clinic.id,
                      "active",
                    )}
                  >
                    <Button type="submit" variant="primary" size="md">
                      Reativar clínica
                    </Button>
                  </form>
                ) : null}
                {!canSuspend && !canReactivate ? (
                  <p className="text-sm text-muted-foreground">
                    Status atual ({STATUS_LABELS[clinic.subscription_status]}) não
                    permite suspender ou reativar por aqui.
                  </p>
                ) : null}
              </div>
              {isSuspended ? (
                <p className="text-sm text-amber-600">
                  Clínica suspensa — paywall ativo para usuários da clínica.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-5">
              <CardTitle className="text-base">Modo suporte</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualizar o app da clínica em modo somente leitura, sem acesso a
                prontuário.
              </p>
              <form action={startClinicImpersonation.bind(null, clinic.id)}>
                <Button type="submit" variant="outline" size="md">
                  Impersonar clínica
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 py-5">
              <CardTitle className="text-base">Export LGPD</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gera ZIP com dados da clínica. Ação registrada em auditoria.
              </p>
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={exporting}
                onClick={handleExport}
              >
                {exporting ? "Preparando…" : "Exportar dados da clínica"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
