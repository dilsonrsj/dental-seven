import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { listClinicsForAdmin } from "@/lib/admin/actions";
import { PLAN_LABELS } from "@/lib/billing/plans";

export default async function AdminPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  const clinics = await listClinicsForAdmin();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">SuperAdmin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clínicas e módulos — DR7 Performance
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Clínica</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {clinics.map((clinic) => (
              <tr key={clinic.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{clinic.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {clinic.slug}
                    {clinic.deleted_at ? " · encerrada" : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {PLAN_LABELS[clinic.plan_key as keyof typeof PLAN_LABELS]}
                </td>
                <td className="px-4 py-3 capitalize">
                  {clinic.subscription_status}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/clinicas/${clinic.id}`}
                    className="text-primary hover:underline"
                  >
                    Gerenciar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/agenda" className="text-sm text-muted-foreground hover:underline">
        ← Voltar ao app
      </Link>
    </div>
  );
}
