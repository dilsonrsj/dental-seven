"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, Card, CardContent, Input } from "@/components/ui";
import {
  PLAN_LABELS,
  type ModuleKey,
  type PlanKey,
} from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/subscription";
import type {
  AdminClinicListFilters,
  ClinicListRow,
  FairUseLevel,
} from "@/modules/admin/types";

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trial",
  active: "Ativa",
  past_due: "Past due",
  expired: "Expirada",
  canceled: "Encerrada",
};

const MODULE_LABELS: Record<ModuleKey, string> = {
  agenda: "Agenda",
  pacientes: "Pacientes",
  whatsapp: "WhatsApp",
  ai_agent: "Agente IA",
  prontuario: "Prontuário",
  procedimentos: "Procedimentos",
  estoque: "Estoque",
  financeiro: "Financeiro",
  fornecedores: "Fornecedores",
  convenios: "Convênios",
};

const PLAN_OPTIONS = Object.entries(PLAN_LABELS) as [PlanKey, string][];
const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [
  SubscriptionStatus,
  string,
][];
const MODULE_OPTIONS = Object.entries(MODULE_LABELS) as [ModuleKey, string][];

type ClinicListProps = {
  clinics: ClinicListRow[];
  filters: AdminClinicListFilters;
};

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

function statusBadgeClass(status: SubscriptionStatus): string {
  if (status === "active") return "border-emerald-500/40 text-emerald-600";
  if (status === "trialing") return "border-sky-500/40 text-sky-600";
  if (status === "past_due") return "border-amber-500/40 text-amber-600";
  if (status === "expired" || status === "canceled") {
    return "border-destructive/40 text-destructive";
  }
  return "border-muted-foreground/30 text-muted-foreground";
}

function whatsappPercentClass(level: FairUseLevel): string {
  if (level === "exceeded") return "text-destructive font-medium";
  if (level === "warning") return "text-amber-600 font-medium";
  return "";
}

function selectClassName(): string {
  return "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";
}

export function ClinicList({ clinics, filters }: ClinicListProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-5">
          <form
            action="/admin/clinicas"
            method="get"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          >
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-2">
              <label htmlFor="search" className="text-sm text-muted-foreground">
                Busca
              </label>
              <Input
                id="search"
                name="search"
                defaultValue={filters.search ?? ""}
                placeholder="Nome ou slug"
                aria-label="Buscar por nome ou slug"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="planKey" className="text-sm text-muted-foreground">
                Plano
              </label>
              <select
                id="planKey"
                name="planKey"
                defaultValue={filters.planKey ?? ""}
                className={selectClassName()}
              >
                <option value="">Todos</option>
                {PLAN_OPTIONS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status" className="text-sm text-muted-foreground">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={filters.status ?? ""}
                className={selectClassName()}
              >
                <option value="">Todos</option>
                {STATUS_OPTIONS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="moduleKey"
                className="text-sm text-muted-foreground"
              >
                Módulo
              </label>
              <select
                id="moduleKey"
                name="moduleKey"
                defaultValue={filters.moduleKey ?? ""}
                className={selectClassName()}
              >
                <option value="">Todos</option>
                {MODULE_OPTIONS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end gap-3 sm:col-span-2 lg:col-span-3 xl:col-span-6 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="fairUseAlert"
                  value="true"
                  defaultChecked={filters.fairUseAlert === true}
                  className="size-4 rounded border-border"
                />
                Somente alerta de uso (≥ 80%)
              </label>

              <div className="flex gap-2">
                <Button type="submit">Filtrar</Button>
                <Link
                  href="/admin/clinicas"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-surface"
                >
                  Limpar
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        {clinics.length === 0 ? (
          <CardContent className="py-5 text-sm text-muted-foreground">
            Nenhuma clínica encontrada com os filtros selecionados.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Clínica</th>
                  <th className="px-4 py-3 font-medium">Plano</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Trial</th>
                  <th className="px-4 py-3 font-medium">% WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Criada em</th>
                </tr>
              </thead>
              <tbody>
                {clinics.map((clinic) => (
                  <tr
                    key={clinic.id}
                    className="border-t border-border hover:bg-surface/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clinicas/${clinic.id}`}
                        className="group block"
                      >
                        <div className="font-medium group-hover:text-primary group-hover:underline">
                          {clinic.name}
                          {clinic.deleted_at ? (
                            <span className="ml-2 text-xs text-destructive">
                              (encerrada)
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {clinic.slug}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {PLAN_LABELS[clinic.plan_key]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={statusBadgeClass(clinic.subscription_status)}>
                        {STATUS_LABELS[clinic.subscription_status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {clinic.subscription_status === "trialing" &&
                      clinic.trial_ends_at
                        ? formatDate(clinic.trial_ends_at)
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 ${whatsappPercentClass(clinic.fairUseLevel)}`}
                    >
                      {formatPercent(clinic.whatsappUsagePercent)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(clinic.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Voltar ao dashboard
        </Link>
        <p className="text-sm text-muted-foreground">
          {clinics.length}{" "}
          {clinics.length === 1 ? "clínica" : "clínicas"}
        </p>
      </div>
    </div>
  );
}
