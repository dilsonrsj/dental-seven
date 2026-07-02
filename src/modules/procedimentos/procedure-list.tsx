"use client";

import { useState, type FormEvent } from "react";
import { Badge, Button, Card, CardContent, Input, Modal, toast } from "@/components/ui";
import {
  createProcedure,
  setProcedureActive,
  updateProcedure,
} from "./actions";
import { BomEditor } from "./bom-editor";
import {
  brlInputToCents,
  centsToBrlInput,
  formatBrlFromCents,
} from "./price-utils";
import type { ProcedureRow, SupplyRow } from "./types";

type ProcedureListProps = {
  procedures: ProcedureRow[];
  supplies: SupplyRow[];
  isAdmin: boolean;
};

type ProcedureFormState = {
  name: string;
  base_price_brl: string;
  default_duration_min: string;
};

const durationOptions = [15, 30, 45, 60, 90, 120];

export function ProcedureList({
  procedures,
  supplies,
  isAdmin,
}: ProcedureListProps) {
  const [items, setItems] = useState(procedures);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProcedureRow | null>(null);
  const [form, setForm] = useState<ProcedureFormState>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(procedure: ProcedureRow) {
    setEditing(procedure);
    setForm({
      name: procedure.name,
      base_price_brl: centsToBrlInput(procedure.base_price_cents),
      default_duration_min: String(procedure.default_duration_min),
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const payload = {
        name: form.name,
        base_price_cents: brlInputToCents(form.base_price_brl),
        default_duration_min: Number(form.default_duration_min),
      };

      const saved = editing
        ? await updateProcedure(editing.id, payload)
        : await createProcedure(payload);

      setItems((current) => {
        if (editing) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [...current, saved].sort((a, b) => a.name.localeCompare(b.name));
      });
      setModalOpen(false);
      toast.success(editing ? "Procedimento atualizado." : "Procedimento criado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(procedure: ProcedureRow) {
    try {
      setIsSaving(true);
      const saved = await setProcedureActive(procedure.id, !procedure.is_active);
      setItems((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      toast.success(saved.is_active ? "Procedimento ativado." : "Procedimento desativado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {isAdmin ? (
        <div className="flex justify-end">
          <Button type="button" onClick={openCreate}>
            Novo procedimento
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum procedimento cadastrado. O administrador pode criar o
              catálogo da clínica.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Preço base</th>
                <th className="px-4 py-3 font-medium">Duração</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {isAdmin ? (
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {items.map((procedure) => (
                <tr key={procedure.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{procedure.name}</td>
                  <td className="px-4 py-3">
                    {formatBrlFromCents(procedure.base_price_cents)}
                  </td>
                  <td className="px-4 py-3">
                    {procedure.default_duration_min} min
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        procedure.is_active
                          ? "border-primary/30 text-primary"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }
                    >
                      {procedure.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isSaving}
                          onClick={() => openEdit(procedure)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSaving}
                          onClick={() => void handleToggleActive(procedure)}
                        >
                          {procedure.is_active ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin ? (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Editar procedimento" : "Novo procedimento"}
          className="max-h-[90vh] max-w-xl overflow-y-auto"
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
                placeholder="Limpeza, clareamento..."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Preço base (R$)</span>
                <Input
                  required
                  inputMode="decimal"
                  value={form.base_price_brl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      base_price_brl: event.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Duração padrão</span>
                <select
                  required
                  value={form.default_duration_min}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      default_duration_min: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {durationOptions.map((minutes) => (
                    <option key={minutes} value={String(minutes)}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {editing ? (
              <BomEditor procedureId={editing.id} supplies={supplies} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Salve o procedimento para vincular insumos (BOM).
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Fechar
              </Button>
              <Button type="submit" disabled={isSaving}>
                Salvar
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function emptyForm(): ProcedureFormState {
  return {
    name: "",
    base_price_brl: "0,00",
    default_duration_min: "30",
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao salvar procedimento.";
}
