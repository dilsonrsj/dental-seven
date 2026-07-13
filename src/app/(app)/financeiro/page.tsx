import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import {
  getDentistRevenueSummary,
  getMonthFinanceSummary,
  listFinancialEntries,
} from "@/modules/financeiro/actions";
import { FinanceDashboard } from "@/modules/financeiro/finance-dashboard";
import { getOpenReceivableCents } from "@/modules/convenios/actions";
import { formatBrlFromCents } from "@/modules/procedimentos/price-utils";

function currentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default async function FinanceiroPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (!ctx.enabledModules.includes("financeiro")) {
    redirect("/agenda");
  }

  const isAdmin = ctx.profile.role === "clinic_admin";
  const isDentist = ctx.profile.role === "dentist";
  if (!isAdmin && !isDentist) {
    redirect("/agenda");
  }

  const yearMonth = currentYearMonth();
  const dentistId = isDentist ? ctx.profile.dentist_id : null;

  const conveniosEnabled = ctx.enabledModules.includes("convenios");

  if (isAdmin) {
    const [summary, entries, receivableCents] = await Promise.all([
      getMonthFinanceSummary(yearMonth),
      listFinancialEntries(yearMonth),
      conveniosEnabled ? getOpenReceivableCents() : Promise.resolve(0),
    ]);

    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Financeiro
        </h1>
        {conveniosEnabled && receivableCents > 0 && (
          <Link
            href="/convenios"
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"
          >
            <span className="text-sm text-muted-foreground">
              A receber de convênios (guias em aberto)
            </span>
            <span className="font-display text-lg font-semibold">
              {formatBrlFromCents(receivableCents)}
            </span>
          </Link>
        )}
        <FinanceDashboard
          isAdmin
          dentistId={dentistId}
          initialYearMonth={yearMonth}
          initialSummary={summary}
          initialRevenueSummary={null}
          initialEntries={entries}
        />
      </div>
    );
  }

  const [revenueSummary, entries] = await Promise.all([
    getDentistRevenueSummary(yearMonth),
    listFinancialEntries(yearMonth),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Financeiro
      </h1>
      <FinanceDashboard
        isAdmin={false}
        dentistId={dentistId}
        initialYearMonth={yearMonth}
        initialSummary={null}
        initialRevenueSummary={revenueSummary}
        initialEntries={entries}
      />
    </div>
  );
}
