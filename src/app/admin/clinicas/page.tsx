import Link from "next/link";
import { redirect } from "next/navigation";
import { listClinicsForAdmin } from "@/lib/admin/actions";
import { getAuthContext } from "@/lib/auth/context";
import type { ModuleKey, PlanKey } from "@/lib/billing/plans";
import type { SubscriptionStatus } from "@/lib/billing/subscription";
import { ClinicList } from "@/modules/admin/clinic-list";
import type { AdminClinicListFilters } from "@/modules/admin/types";

type ClinicasPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const PLAN_KEYS: PlanKey[] = [
  "essencial",
  "conecta",
  "inteligente",
  "completo",
];

const STATUSES: SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "expired",
  "canceled",
];

const MODULE_KEYS: ModuleKey[] = [
  "agenda",
  "pacientes",
  "whatsapp",
  "ai_agent",
  "prontuario",
  "procedimentos",
  "estoque",
  "financeiro",
  "fornecedores",
];

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseFilters(
  params: Record<string, string | string[] | undefined>,
): AdminClinicListFilters {
  const planKey = firstParam(params.planKey);
  const status = firstParam(params.status);
  const moduleKey = firstParam(params.moduleKey);
  const search = firstParam(params.search);
  const fairUseAlert = firstParam(params.fairUseAlert) === "true";

  return {
    ...(planKey && PLAN_KEYS.includes(planKey as PlanKey)
      ? { planKey: planKey as PlanKey }
      : {}),
    ...(status && STATUSES.includes(status as SubscriptionStatus)
      ? { status: status as SubscriptionStatus }
      : {}),
    ...(moduleKey && MODULE_KEYS.includes(moduleKey as ModuleKey)
      ? { moduleKey: moduleKey as ModuleKey }
      : {}),
    ...(search?.trim() ? { search: search.trim() } : {}),
    ...(fairUseAlert ? { fairUseAlert: true } : {}),
  };
}

export default async function AdminClinicasPage({
  searchParams,
}: ClinicasPageProps) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  const params = (await searchParams) ?? {};
  const filters = parseFilters(params);
  const clinics = await listClinicsForAdmin(filters);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← SuperAdmin
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Clínicas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lista de clínicas da plataforma com filtros operacionais
            </p>
          </div>
          <Link
            href="/admin/clinicas/nova"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Nova clínica
          </Link>
        </div>
      </div>

      <ClinicList clinics={clinics} filters={filters} />
    </div>
  );
}
