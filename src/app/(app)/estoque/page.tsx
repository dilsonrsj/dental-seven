import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import { listStockSupplies } from "@/modules/estoque/actions";
import { StockList } from "@/modules/estoque/stock-list";

export default async function EstoquePage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (!ctx.enabledModules.includes("estoque")) {
    redirect("/agenda");
  }

  const isAdmin = ctx.profile.role === "clinic_admin";
  const fornecedoresEnabled = ctx.enabledModules.includes("fornecedores");
  const supplies = await listStockSupplies();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Estoque
      </h1>
      <StockList
        supplies={supplies}
        isAdmin={isAdmin}
        fornecedoresEnabled={fornecedoresEnabled}
      />
    </div>
  );
}
