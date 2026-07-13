"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Modal, toast } from "@/components/ui";
import {
  formatIsoDateAsBr,
  maskBrDateInput,
  parseBrDateToIso,
} from "@/lib/date/br-date";
import { brlInputToCents } from "@/modules/procedimentos/price-utils";
import { createManualEntry } from "./actions";
import type { FinancialEntryRow, ManualEntryKind } from "./types";

type ManualEntryFormProps = {
  yearMonth: string;
  onClose: () => void;
  onSuccess: (entry: FinancialEntryRow) => void;
};

export function ManualEntryForm({
  yearMonth,
  onClose,
  onSuccess,
}: ManualEntryFormProps) {
  const [kind, setKind] = useState<ManualEntryKind>("revenue");
  const [amountBrl, setAmountBrl] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(defaultEntryDateBr(yearMonth));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const entry = await createManualEntry({
        kind,
        amountCents: brlInputToCents(amountBrl),
        description: description.trim(),
        entryDate: parseBrDateToIso(entryDate),
      });
      onSuccess(entry);
      toast.success("Lançamento registrado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Novo lançamento">
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Tipo</span>
          <select
            className="flex h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={kind}
            onChange={(event) => setKind(event.target.value as ManualEntryKind)}
          >
            <option value="revenue">Receita</option>
            <option value="expense">Despesa</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Valor (R$)</span>
          <Input
            required
            inputMode="decimal"
            value={amountBrl}
            onChange={(event) => setAmountBrl(event.target.value)}
            placeholder="Ex.: 150,00"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Descrição</span>
          <Input
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: Consulta avulsa"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Data</span>
          <Input
            required
            inputMode="numeric"
            autoComplete="off"
            placeholder="dd/mm/aaaa"
            value={entryDate}
            onChange={(event) =>
              setEntryDate(maskBrDateInput(event.target.value))
            }
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

function defaultEntryDateBr(yearMonth: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const iso = today.startsWith(yearMonth) ? today : `${yearMonth}-01`;
  return formatIsoDateAsBr(iso);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao registrar lançamento.";
}
