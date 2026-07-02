import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/context";
import {
  listSuppliers,
  listSuppliesForLinking,
} from "@/modules/fornecedores/actions";
import { SupplierList } from "@/modules/fornecedores/supplier-list";
import { SupplyLinkTable } from "@/modules/fornecedores/supply-link-table";

export default async function FornecedoresPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/entrar");
  if (!ctx.enabledModules.includes("fornecedores")) {
    redirect("/agenda");
  }
  if (ctx.profile.role !== "clinic_admin") {
    redirect("/agenda");
  }

  const [suppliers, supplies] = await Promise.all([
    listSuppliers(),
    listSuppliesForLinking(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Fornecedores
      </h1>

      <SupplierList suppliers={suppliers} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Insumos vinculados
          </h2>
          <p className="text-sm text-muted-foreground">
            Defina o fornecedor preferencial de cada insumo para reposição via
            WhatsApp no estoque.
          </p>
        </div>
        <SupplyLinkTable supplies={supplies} suppliers={suppliers} />
      </section>
    </div>
  );
}
