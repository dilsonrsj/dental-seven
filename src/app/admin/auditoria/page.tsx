import Link from "next/link";
import { redirect } from "next/navigation";
import { listAdminAuditLog } from "@/lib/admin/actions";
import { getAuthContext } from "@/lib/auth/context";
import type { AdminAuditLogFilters } from "@/modules/admin/types";

type AuditoriaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    "clinic.plan_changed": "Plano alterado",
    "clinic.trial_extended": "Trial estendido",
    "clinic.suspended": "Clínica suspensa",
    "clinic.reactivated": "Clínica reativada",
    "clinic.module_toggled": "Módulo alterado",
    "clinic.export_requested": "Export LGPD solicitado",
    "clinic.notes_updated": "Notas internas atualizadas",
    "clinic.provisioned": "Clínica provisionada",
    "clinic.impersonation_started": "Impersonação iniciada",
    "clinic.impersonation_stopped": "Impersonação encerrada",
    "clinic.whatsapp_throttle_set": "WhatsApp throttle alterado",
    "fair_use.email_sent": "E-mail fair use enviado",
  };
  return labels[action] ?? action;
}

export default async function AdminAuditoriaPage({
  searchParams,
}: AuditoriaPageProps) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  const params = (await searchParams) ?? {};
  const filters: AdminAuditLogFilters = {
    ...(firstParam(params.clinicId)
      ? { clinicId: firstParam(params.clinicId) }
      : {}),
    ...(firstParam(params.action)
      ? { action: firstParam(params.action) }
      : {}),
  };

  const logs = await listAdminAuditLog(100, filters);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← SuperAdmin
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log global de ações SuperAdmin
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        {logs.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Nenhum registro encontrado.
          </p>
        ) : (
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-surface text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Quando</th>
                <th className="px-4 py-3 font-medium">Ator</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Clínica</th>
                <th className="px-4 py-3 font-medium">Metadados</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3">{row.actor_name}</td>
                  <td className="px-4 py-3">{actionLabel(row.action)}</td>
                  <td className="px-4 py-3">
                    {row.clinic_id ? (
                      <Link
                        href={`/admin/clinicas/${row.clinic_id}`}
                        className="hover:underline"
                      >
                        {row.clinic_name ?? row.clinic_id}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                    {JSON.stringify(row.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
