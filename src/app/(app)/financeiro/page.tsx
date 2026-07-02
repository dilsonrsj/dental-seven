import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import {
  getDentistRevenueSummary,
  getMonthFinanceSummary,
  listFinancialEntries,
} from "@/modules/financeiro/actions";
import { FinanceDashboard } from "@/modules/financeiro/finance-dashboard";

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

  if (isAdmin) {
    const [summary, entries] = await Promise.all([
      getMonthFinanceSummary(yearMonth),
      listFinancialEntries(yearMonth),
    ]);

    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Financeiro
        </h1>
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
