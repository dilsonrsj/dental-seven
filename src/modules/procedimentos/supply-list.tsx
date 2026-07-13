"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Card, CardContent, Input, Modal, toast } from "@/components/ui";
import { createSupply, setSupplyActive, updateSupply } from "./actions";
import {
  centsToBrlInput,
  formatBrlFromCents,
} from "./price-utils";
import { parseOptionalCostCents } from "./validation";
import type { SupplyRow } from "./types";

type SupplyListProps = {
  supplies: SupplyRow[];
};

type SupplyFormState = {
  name: string;
  unit_label: string;
  unit_cost_brl: string;
  sku: string;
};

const unitSuggestions = ["un", "cx", "par", "ml", "g"];

function unitOptionsFor(current: string): string[] {
  if (!current || unitSuggestions.includes(current)) return unitSuggestions;
  return [...unitSuggestions, current];
}

export function SupplyList({ supplies }: SupplyListProps) {
  const [items, setItems] = useState(supplies);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SupplyRow | null>(null);
  const [form, setForm] = useState<SupplyFormState>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(supply: SupplyRow) {
    setEditing(supply);
    setForm({
      name: supply.name,
      unit_label: supply.unit_label,
      unit_cost_brl:
        supply.unit_cost_cents === null
          ? ""
          : centsToBrlInput(supply.unit_cost_cents),
      sku: supply.sku ?? "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const payload = {
        name: form.name,
        unit_label: form.unit_label,
        unit_cost_cents: parseOptionalCostCents(form.unit_cost_brl),
        sku: form.sku.trim() || null,
      };

      const saved = editing
        ? await updateSupply(editing.id, payload)
        : await createSupply(payload);

      setItems((current) => {
        if (editing) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [...current, saved].sort((a, b) => a.name.localeCompare(b.name));
      });
      setModalOpen(false);
      toast.success(editing ? "Insumo atualizado." : "Insumo criado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(supply: SupplyRow) {
    try {
      setIsSaving(true);
      const saved = await setSupplyActive(supply.id, !supply.is_active);
      setItems((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      toast.success(saved.is_active ? "Insumo ativado." : "Insumo desativado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" onClick={openCreate}>
          Novo insumo
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum insumo cadastrado. Crie insumos para montar o BOM dos
              procedimentos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {items.map((supply) => (
              <Card key={supply.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{supply.name}</p>
                    <Badge
                      className={
                        supply.is_active
                          ? "shrink-0 border-primary/30 text-primary"
                          : "shrink-0 border-muted-foreground/30 text-muted-foreground"
                      }
                    >
                      {supply.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{supply.unit_label}</span>
                    <span>
                      {supply.unit_cost_cents === null
                        ? "Sem custo"
                        : formatBrlFromCents(supply.unit_cost_cents)}
                    </span>
                    {supply.sku ? <span>SKU: {supply.sku}</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={() => openEdit(supply)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => void handleToggleActive(supply)}
                    >
                      {supply.is_active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="ds-table-shell hidden md:block">
            <table className="ds-table">
            <thead className="bg-surface text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Unidade</th>
                <th className="px-4 py-3 font-medium">Custo unitário</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((supply) => (
                <tr key={supply.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{supply.name}</td>
                  <td className="px-4 py-3">{supply.unit_label}</td>
                  <td className="px-4 py-3">
                    {supply.unit_cost_cents === null
                      ? "—"
                      : formatBrlFromCents(supply.unit_cost_cents)}
                  </td>
                  <td className="px-4 py-3">{supply.sku ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        supply.is_active
                          ? "border-primary/30 text-primary"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }
                    >
                      {supply.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSaving}
                        onClick={() => openEdit(supply)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => void handleToggleActive(supply)}
                      >
                        {supply.is_active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar insumo" : "Novo insumo"}
      >
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Nome</span>
            <Input
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Luva, resina, anestésico..."
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Unidade</span>
            <select
              required
              value={form.unit_label}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unit_label: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {unitOptionsFor(form.unit_label).map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Custo unitário (R$)</span>
            <Input
              inputMode="decimal"
              value={form.unit_cost_brl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unit_cost_brl: event.target.value,
                }))
              }
              placeholder="Opcional"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">SKU</span>
            <Input
              value={form.sku}
              onChange={(event) =>
                setForm((current) => ({ ...current, sku: event.target.value }))
              }
              placeholder="Opcional"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
            <Button type="submit" disabled={isSaving}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function emptyForm(): SupplyFormState {
  return {
    name: "",
    unit_label: "un",
    unit_cost_brl: "",
    sku: "",
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao salvar insumo.";
}
