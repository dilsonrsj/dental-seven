import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { getClinicForAdmin } from "@/lib/admin/actions";
import { PLAN_LABELS } from "@/lib/billing/plans";
import { ModuleToggleList } from "./module-toggle-list";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminClinicPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  const { clinic, modules } = await getClinicForAdmin(id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Clínicas
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">{clinic.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PLAN_LABELS[clinic.plan_key as keyof typeof PLAN_LABELS]} ·{" "}
          <span className="capitalize">{clinic.subscription_status}</span>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Módulos</h2>
        <ModuleToggleList clinicId={clinic.id} modules={modules} />
      </section>

      <a
        href={`/api/clinics/${clinic.id}/export`}
        className="inline-block text-sm text-primary hover:underline"
      >
        Exportar dados desta clínica
      </a>
    </div>
  );
}
