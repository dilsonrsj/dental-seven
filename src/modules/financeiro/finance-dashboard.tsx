"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { formatBrlFromCents } from "@/modules/procedimentos/price-utils";
import {
  getDentistRevenueSummary,
  getMonthFinanceSummary,
  listFinancialEntries,
} from "./actions";
import { FixedCostsForm } from "./fixed-costs-form";
import { ManualEntryForm } from "./manual-entry-form";
import type {
  FinancialEntryRow,
  FinancialEntrySource,
  FinancialEntryType,
  MonthSummary,
} from "./types";

type FinanceDashboardProps = {
  isAdmin: boolean;
  dentistId: string | null;
  initialYearMonth: string;
  initialSummary: MonthSummary | null;
  initialRevenueSummary: { revenueCents: number } | null;
  initialEntries: FinancialEntryRow[];
};

export function FinanceDashboard({
  isAdmin,
  initialYearMonth,
  initialSummary,
  initialRevenueSummary,
  initialEntries,
}: FinanceDashboardProps) {
  const [yearMonth, setYearMonth] = useState(initialYearMonth);
  const [summary, setSummary] = useState(initialSummary);
  const [revenueSummary, setRevenueSummary] = useState(initialRevenueSummary);
  const [entries, setEntries] = useState(initialEntries);
  const [isLoading, setIsLoading] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [fixedCostsOpen, setFixedCostsOpen] = useState(false);

  async function handleMonthChange(nextYearMonth: string) {
    setYearMonth(nextYearMonth);
    setIsLoading(true);

    try {
      if (isAdmin) {
        const [nextSummary, nextEntries] = await Promise.all([
          getMonthFinanceSummary(nextYearMonth),
          listFinancialEntries(nextYearMonth),
        ]);
        setSummary(nextSummary);
        setEntries(nextEntries);
      } else {
        const [nextRevenueSummary, nextEntries] = await Promise.all([
          getDentistRevenueSummary(nextYearMonth),
          listFinancialEntries(nextYearMonth),
        ]);
        setRevenueSummary(nextRevenueSummary);
        setEntries(nextEntries);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleManualEntrySuccess(entry: FinancialEntryRow) {
    if (entry.entry_date.startsWith(yearMonth)) {
      setEntries((current) => [entry, ...current]);
    }
    setManualEntryOpen(false);
    void refreshSummary();
  }

  function handleFixedCostsSuccess(fixedCostsCents: number) {
    setSummary((current) =>
      current
        ? {
            ...current,
            fixedCostsCents,
            marginCents:
              current.revenueCents -
              current.variableCostCents -
              fixedCostsCents,
          }
        : current,
    );
    setFixedCostsOpen(false);
  }

  async function refreshSummary() {
    if (isAdmin) {
      const nextSummary = await getMonthFinanceSummary(yearMonth);
      setSummary(nextSummary);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Mês</span>
          <Input
            type="month"
            value={yearMonth}
            disabled={isLoading}
            onChange={(event) => void handleMonthChange(event.target.value)}
            className="w-auto min-w-[10rem]"
          />
        </label>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setManualEntryOpen(true)}>
              Novo lançamento
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFixedCostsOpen(true)}
            >
              Custos fixos
            </Button>
          </div>
        )}
      </div>

      {isAdmin && summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Receita"
            value={summary.revenueCents}
            valueClassName="text-emerald-600"
          />
          <SummaryCard
            label="Custo variável"
            value={summary.variableCostCents}
            valueClassName="text-muted-foreground"
            displayAsCost
          />
          <SummaryCard
            label="Custos fixos"
            value={summary.fixedCostsCents}
            valueClassName="text-muted-foreground"
            displayAsCost
          />
          <SummaryCard
            label="Margem"
            value={summary.marginCents}
            valueClassName={
              summary.marginCents >= 0
                ? "text-emerald-600"
                : "text-destructive"
            }
          />
        </div>
      )}

      {!isAdmin && revenueSummary && (
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-muted-foreground">Minha receita</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-emerald-600">
              {formatBrlFromCents(revenueSummary.revenueCents)}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Lançamentos recentes
        </h2>

        {entries.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhum lançamento neste mês.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="ds-table-shell">
            <table className="ds-table">
              <thead className="bg-surface text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  {isAdmin && (
                    <th className="px-4 py-3 font-medium">Origem</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatEntryDate(entry.entry_date)}
                    </td>
                    <td className="px-4 py-3">
                      {ENTRY_TYPE_LABELS[entry.entry_type]}
                    </td>
                    <td className="px-4 py-3">{entry.description}</td>
                    <td
                      className={`px-4 py-3 text-right font-medium whitespace-nowrap ${amountClassName(entry.amount_cents)}`}
                    >
                      {formatBrlFromCents(entry.amount_cents)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <SourceBadge source={entry.source} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {manualEntryOpen && (
        <ManualEntryForm
          yearMonth={yearMonth}
          onClose={() => setManualEntryOpen(false)}
          onSuccess={handleManualEntrySuccess}
        />
      )}

      {fixedCostsOpen && summary && (
        <FixedCostsForm
          yearMonth={yearMonth}
          initialFixedCostsCents={summary.fixedCostsCents}
          onClose={() => setFixedCostsOpen(false)}
          onSuccess={handleFixedCostsSuccess}
        />
      )}
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  valueClassName: string;
  displayAsCost?: boolean;
};

function SummaryCard({
  label,
  value,
  valueClassName,
  displayAsCost = false,
}: SummaryCardProps) {
  const displayValue = displayAsCost ? -Math.abs(value) : value;

  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={`mt-1 font-display text-2xl font-semibold tracking-tight ${valueClassName}`}
        >
          {formatBrlFromCents(displayValue)}
        </p>
      </CardContent>
    </Card>
  );
}

function SourceBadge({ source }: { source: FinancialEntrySource }) {
  if (source === "auto") {
    return (
      <Badge className="border-primary/30 text-primary">Automático</Badge>
    );
  }

  return (
    <Badge className="border-border text-muted-foreground">Manual</Badge>
  );
}

const ENTRY_TYPE_LABELS: Record<FinancialEntryType, string> = {
  revenue: "Receita",
  revenue_reversal: "Estorno receita",
  variable_cost: "Custo variável",
  variable_cost_reversal: "Estorno custo",
  manual_revenue: "Receita manual",
  manual_expense: "Despesa manual",
};

function formatEntryDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day),
  );
}

function amountClassName(amountCents: number): string {
  if (amountCents > 0) return "text-emerald-600";
  if (amountCents < 0) return "text-muted-foreground";
  return "";
}
