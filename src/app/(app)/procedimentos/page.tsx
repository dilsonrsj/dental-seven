import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { listProcedures, listSupplies } from "@/modules/procedimentos/actions";
import { ProcedimentosTabs } from "@/modules/procedimentos/procedimentos-tabs";

export default async function ProcedimentosPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (!ctx.enabledModules.includes("procedimentos")) {
    redirect("/agenda");
  }

  const isAdmin = ctx.profile.role === "clinic_admin";
  const procedures = await listProcedures();
  const supplies = isAdmin ? await listSupplies() : [];

  return (
    <ProcedimentosTabs
      procedures={procedures}
      supplies={supplies}
      isAdmin={isAdmin}
    />
  );
}
