"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Modal, toast } from "@/components/ui";
import { updateSupplyMinQuantity } from "./actions";
import type { StockSupplyRow } from "./types";

type MinQuantityFormProps = {
  supply: StockSupplyRow;
  onClose: () => void;
  onSuccess: (supply: StockSupplyRow) => void;
};

export function MinQuantityForm({
  supply,
  onClose,
  onSuccess,
}: MinQuantityFormProps) {
  const [minQuantity, setMinQuantity] = useState(
    supply.min_quantity == null ? "" : String(supply.min_quantity),
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const trimmed = minQuantity.trim();
      const parsed =
        trimmed === ""
          ? null
          : Number(trimmed.replace(",", "."));

      const updated = await updateSupplyMinQuantity(supply.id, parsed);
      onSuccess(updated);
      toast.success("Estoque mínimo atualizado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Estoque mínimo">
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <p className="text-sm text-muted-foreground">
          Insumo: <span className="font-medium text-foreground">{supply.name}</span>
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Quantidade mínima</span>
          <Input
            inputMode="decimal"
            value={minQuantity}
            onChange={(event) => setMinQuantity(event.target.value)}
            placeholder="Deixe vazio para desativar alerta"
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
    : "Erro ao atualizar estoque mínimo.";
}
