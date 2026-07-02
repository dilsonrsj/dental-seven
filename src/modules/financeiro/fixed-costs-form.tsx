"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Modal, toast } from "@/components/ui";
import {
  brlInputToCents,
  centsToBrlInput,
} from "@/modules/procedimentos/price-utils";
import { updateMonthlyFixedCosts } from "./actions";

type FixedCostsFormProps = {
  yearMonth: string;
  initialFixedCostsCents: number;
  onClose: () => void;
  onSuccess: (fixedCostsCents: number) => void;
};

export function FixedCostsForm({
  yearMonth,
  initialFixedCostsCents,
  onClose,
  onSuccess,
}: FixedCostsFormProps) {
  const [amountBrl, setAmountBrl] = useState(
    centsToBrlInput(initialFixedCostsCents),
  );
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const result = await updateMonthlyFixedCosts(
        yearMonth,
        brlInputToCents(amountBrl),
      );
      onSuccess(result.fixed_costs_cents);
      toast.success("Custos fixos atualizados.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Custos fixos do mês">
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <p className="text-sm text-muted-foreground">
          Período:{" "}
          <span className="font-medium text-foreground">
            {formatYearMonthLabel(yearMonth)}
          </span>
        </p>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Total de custos fixos (R$)</span>
          <Input
            required
            inputMode="decimal"
            value={amountBrl}
            onChange={(event) => setAmountBrl(event.target.value)}
            placeholder="Ex.: 5.000,00"
          />
        </label>

        <p className="text-xs text-muted-foreground">
          Valor único mensal (aluguel, salários fixos, etc.). Não inclui custos
          variáveis das consultas.
        </p>

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

function formatYearMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Erro ao atualizar custos fixos.";
}
