import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/admin/actions";
import { getAuthContext } from "@/lib/auth/context";
import { AdminDashboard } from "@/modules/admin/admin-dashboard";

export default async function AdminPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold">SuperAdmin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cockpit operacional — DR7 Performance
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/admin/clinicas" className="text-primary hover:underline">
            Clínicas
          </Link>
          <Link href="/admin/auditoria" className="text-primary hover:underline">
            Auditoria
          </Link>
        </div>
      </div>

      <AdminDashboard {...data} />
    </div>
  );
}
