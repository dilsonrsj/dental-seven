import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { ProvisionClinicForm } from "@/modules/admin/provision-clinic-form";

export default async function NovaClinicaPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (ctx.profile.role !== "super_admin") redirect("/agenda");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <Link
          href="/admin/clinicas"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Clínicas
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">Nova clínica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provisioning manual — cria clínica e envia convite ao primeiro admin
        </p>
      </div>

      <ProvisionClinicForm />
    </div>
  );
}
