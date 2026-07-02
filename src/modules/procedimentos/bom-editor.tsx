"use client";

import { useEffect, useState } from "react";
import { Button, Input, toast } from "@/components/ui";
import {
  listProcedureBom,
  removeProcedureBomItem,
  upsertProcedureBomItem,
} from "./actions";
import type { ProcedureBomRow, SupplyRow } from "./types";

type BomEditorProps = {
  procedureId: string;
  supplies: SupplyRow[];
};

export function BomEditor({ procedureId, supplies }: BomEditorProps) {
  const [items, setItems] = useState<ProcedureBomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplyId, setSupplyId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isSaving, setIsSaving] = useState(false);

  const activeSupplies = supplies.filter((supply) => supply.is_active);

  useEffect(() => {
    let cancelled = false;

    async function loadBom() {
      try {
        setLoading(true);
        const bom = await listProcedureBom(procedureId);
        if (!cancelled) setItems(bom);
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBom();
    return () => {
      cancelled = true;
    };
  }, [procedureId]);

  async function handleAdd() {
    if (!supplyId) {
      toast.error("Selecione um insumo.");
      return;
    }

    try {
      setIsSaving(true);
      const item = await upsertProcedureBomItem({
        procedureId,
        supplyId,
        quantity: Number(quantity),
      });
      setItems((current) => {
        const withoutDuplicate = current.filter(
          (entry) => entry.supply_id !== item.supply_id,
        );
        return [...withoutDuplicate, item];
      });
      setSupplyId("");
      setQuantity("1");
      toast.success("Insumo adicionado ao procedimento.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(itemId: string) {
    try {
      setIsSaving(true);
      await removeProcedureBomItem(itemId);
      setItems((current) => current.filter((item) => item.id !== itemId));
      toast.success("Insumo removido.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <h3 className="text-sm font-medium">Insumos do procedimento (BOM)</h3>
        <p className="text-xs text-muted-foreground">
          Quantidade consumida por execução do procedimento.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block flex-1 space-y-1.5">
          <span className="text-xs font-medium">Insumo</span>
          <select
            value={supplyId}
            onChange={(event) => setSupplyId(event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Selecione...</option>
            {activeSupplies.map((supply) => (
              <option key={supply.id} value={supply.id}>
                {supply.name} ({supply.unit_label})
              </option>
            ))}
          </select>
        </label>

        <label className="block w-full space-y-1.5 sm:w-28">
          <span className="text-xs font-medium">Quantidade</span>
          <Input
            type="number"
            min="0.001"
            step="0.001"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>

        <Button
          type="button"
          disabled={isSaving}
          onClick={() => void handleAdd()}
        >
          Adicionar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando insumos...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum insumo vinculado a este procedimento.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              <span>
                {item.supply?.name ?? "Insumo"}{" "}
                <span className="text-muted-foreground">
                  — {item.quantity} {item.supply?.unit_label ?? "un"}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving}
                onClick={() => void handleRemove(item.id)}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao atualizar BOM.";
}
