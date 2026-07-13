"use client";

import { useState } from "react";
import { Card, CardContent, toast } from "@/components/ui";
import { updateSupplyPreferredSupplier } from "./actions";
import type { SupplierRow, SupplyLinkRow } from "./types";

const selectClassName =
  "h-11 w-full min-w-[12rem] rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";

type SupplyLinkTableProps = {
  supplies: SupplyLinkRow[];
  suppliers: SupplierRow[];
};

export function SupplyLinkTable({ supplies, suppliers }: SupplyLinkTableProps) {
  const [items, setItems] = useState(supplies);
  const [savingSupplyId, setSavingSupplyId] = useState<string | null>(null);

  async function handleSupplierChange(
    supplyId: string,
    preferredSupplierId: string | null,
  ) {
    const previous = items.find((item) => item.id === supplyId);
    if (!previous) return;

    const supplierName =
      preferredSupplierId === null
        ? null
        : (suppliers.find((supplier) => supplier.id === preferredSupplierId)
            ?.name ?? null);

    setItems((current) =>
      current.map((item) =>
        item.id === supplyId
          ? {
              ...item,
              preferred_supplier_id: preferredSupplierId,
              preferred_supplier_name: supplierName,
            }
          : item,
      ),
    );

    try {
      setSavingSupplyId(supplyId);
      await updateSupplyPreferredSupplier(supplyId, preferredSupplierId);
      toast.success("Fornecedor preferencial atualizado.");
    } catch (error) {
      setItems((current) =>
        current.map((item) => (item.id === supplyId ? previous : item)),
      );
      toast.error(getErrorMessage(error));
    } finally {
      setSavingSupplyId(null);
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum insumo ativo cadastrado. Cadastre insumos em Procedimentos
            para vincular fornecedores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="ds-table-shell">
      <table className="ds-table">
        <thead className="bg-surface text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Insumo</th>
            <th className="px-4 py-3 font-medium">Unidade</th>
            <th className="px-4 py-3 font-medium">Fornecedor preferencial</th>
          </tr>
        </thead>
        <tbody>
          {items.map((supply) => (
            <tr key={supply.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{supply.name}</td>
              <td className="px-4 py-3">{supply.unit_label}</td>
              <td className="px-4 py-3">
                <select
                  value={supply.preferred_supplier_id ?? ""}
                  disabled={savingSupplyId === supply.id}
                  onChange={(event) => {
                    const value = event.target.value;
                    void handleSupplierChange(
                      supply.id,
                      value === "" ? null : value,
                    );
                  }}
                  className={selectClassName}
                >
                  <option value="">Nenhum</option>
                  {selectableSuppliers(
                    suppliers,
                    supply.preferred_supplier_id,
                  ).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                      {!supplier.is_active ? " (inativo)" : ""}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function selectableSuppliers(
  suppliers: SupplierRow[],
  preferredSupplierId: string | null,
): SupplierRow[] {
  const active = suppliers.filter((supplier) => supplier.is_active);

  if (!preferredSupplierId) {
    return active;
  }

  const linked = suppliers.find((supplier) => supplier.id === preferredSupplierId);
  if (
    linked &&
    !linked.is_active &&
    !active.some((supplier) => supplier.id === linked.id)
  ) {
    return [...active, linked].sort((a, b) => a.name.localeCompare(b.name));
  }

  return active;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Erro ao atualizar vínculo do insumo.";
}
