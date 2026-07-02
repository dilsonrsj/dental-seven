"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, toast } from "@/components/ui";
import { setSupplierActive } from "./actions";
import { SupplierForm } from "./supplier-form";
import type { SupplierRow } from "./types";

type SupplierListProps = {
  suppliers: SupplierRow[];
};

export function SupplierList({ suppliers }: SupplierListProps) {
  const [items, setItems] = useState(suppliers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(supplier: SupplierRow) {
    setEditing(supplier);
    setFormOpen(true);
  }

  function handleSaved(saved: SupplierRow) {
    setItems((current) => {
      const existing = current.some((item) => item.id === saved.id);
      if (existing) {
        return current
          .map((item) => (item.id === saved.id ? saved : item))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      return [...current, saved].sort((a, b) => a.name.localeCompare(b.name));
    });
    setFormOpen(false);
  }

  async function handleToggleActive(supplier: SupplierRow) {
    try {
      setIsSaving(true);
      const saved = await setSupplierActive(supplier.id, !supplier.is_active);
      setItems((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      );
      toast.success(saved.is_active ? "Fornecedor ativado." : "Fornecedor desativado.");
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
          Novo fornecedor
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nenhum fornecedor cadastrado. Adicione fornecedores para vincular
              aos insumos e acelerar reposição via WhatsApp.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((supplier) => (
                <tr key={supplier.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{supplier.name}</td>
                  <td className="px-4 py-3">{supplier.phone ?? "—"}</td>
                  <td className="px-4 py-3">{supplier.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        supplier.is_active
                          ? "border-primary/30 text-primary"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }
                    >
                      {supplier.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isSaving}
                        onClick={() => openEdit(supplier)}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => void handleToggleActive(supplier)}
                      >
                        {supplier.is_active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen ? (
        <SupplierForm
          supplier={editing}
          onClose={() => setFormOpen(false)}
          onSuccess={handleSaved}
        />
      ) : null}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao alterar fornecedor.";
}
