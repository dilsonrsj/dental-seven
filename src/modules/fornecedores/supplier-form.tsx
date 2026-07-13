"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Modal, toast } from "@/components/ui";
import { portugueseProseFieldProps } from "@/lib/i18n/prose-field";
import { createSupplier, updateSupplier } from "./actions";
import type { SupplierFormInput, SupplierRow } from "./types";

const textareaClassName =
  "flex min-h-[96px] w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

type SupplierFormProps = {
  supplier: SupplierRow | null;
  onClose: () => void;
  onSuccess: (supplier: SupplierRow) => void;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  is_active: boolean;
};

export function SupplierForm({ supplier, onClose, onSuccess }: SupplierFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(supplier));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      const payload: SupplierFormInput = {
        name: form.name,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
      };

      const saved = supplier
        ? await updateSupplier(supplier.id, payload)
        : await createSupplier(payload);

      onSuccess(saved);
      toast.success(supplier ? "Fornecedor atualizado." : "Fornecedor criado.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={supplier ? "Editar fornecedor" : "Novo fornecedor"}
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
            placeholder="Distribuidora, laboratório..."
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Telefone</span>
          <Input
            inputMode="tel"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="Opcional — usado no WhatsApp de reposição"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">E-mail</span>
          <Input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Opcional"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Observações</span>
          <textarea
            {...portugueseProseFieldProps}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            className={textareaClassName}
            placeholder="Contato, prazo de entrega, condições..."
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                is_active: event.target.checked,
              }))
            }
            className="size-4 rounded border-border accent-primary"
          />
          <span>Fornecedor ativo</span>
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

function toFormState(supplier: SupplierRow | null): FormState {
  if (!supplier) {
    return {
      name: "",
      phone: "",
      email: "",
      notes: "",
      is_active: true,
    };
  }

  return {
    name: supplier.name,
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    notes: supplier.notes ?? "",
    is_active: supplier.is_active,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro ao salvar fornecedor.";
}
