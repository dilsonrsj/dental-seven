import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { listProcedures } from "@/modules/procedimentos/actions";
import {
  listActivePlanOptions,
  listCarriersWithPlans,
  listClaims,
} from "@/modules/convenios/actions";
import { ConveniosPageClient } from "@/modules/convenios/convenios-page-client";

export default async function ConveniosPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (!ctx.enabledModules.includes("convenios")) {
    redirect("/agenda");
  }

  const isAdmin = ctx.profile.role === "clinic_admin";

  const [carriers, planOptions, procedures, claims] = await Promise.all([
    listCarriersWithPlans(),
    listActivePlanOptions(),
    listProcedures({ activeOnly: true }),
    listClaims(),
  ]);

  return (
    <ConveniosPageClient
      carriers={carriers}
      planOptions={planOptions}
      procedures={procedures}
      claims={claims}
      isAdmin={isAdmin}
    />
  );
}
