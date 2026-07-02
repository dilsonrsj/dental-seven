"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Modal, toast } from "@/components/ui";
import { recordStockMovement } from "./actions";
import { getStockAlertLevel } from "./stock-level";
import type { StockSupplyRow } from "./types";

type StockMovementFormProps = {
  supply: StockSupplyRow;
  type: "inbound" | "outbound" | "adjustment";
  onClose: () => void;
  onSuccess: (supply: StockSupplyRow) => void;
};

const titles: Record<StockMovementFormProps["type"], string> = {
  inbound: "Entrada de estoque",
  outbound: "Saída de estoque",
  adjustment: "Ajuste de estoque",
};

const quantityLabels: Record<StockMovementFormProps["type"], string> = {
  inbound: "Quantidade",
  outbound: "Quantidade",
  adjustment: "Ajuste (+ ou −)",
};

export function StockMovementForm({
  supply,
  type,
  onClose,
  onSuccess,
}: StockMovementFormProps) {
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const parsedQuantity =
        type === "adjustment"
          ? Number(quantity.replace(",", "."))
          : Math.abs(Number(quantity.replace(",", ".")));

      const movement = await recordStockMovement({
        supplyId: supply.id,
        type,
        quantity: parsedQuantity,
        notes: notes.trim() || undefined,
      });

      const updated: StockSupplyRow = {
        ...supply,
        quantity_on_hand: movement.quantity_after,
        alert_level: getStockAlertLevel({
          quantity_on_hand: movement.quantity_after,
          min_quantity: supply.min_quantity,
        }),
      };

      onSuccess(updated);
      toast.success("Movimentação registrada.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={titles[type]}>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <p className="text-sm text-muted-foreground">
          Insumo: <span className="font-medium text-foreground">{supply.name}</span>
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{quantityLabels[type]}</span>
          <Input
            required
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder={type === "adjustment" ? "Ex.: -2 ou 1.5" : "Ex.: 10"}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Observações</span>
          <Input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opcional"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button type="submit" disabled={isSaving}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Erro ao registrar movimentação.";
}
