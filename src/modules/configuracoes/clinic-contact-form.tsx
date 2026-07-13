"use client";

import { useState } from "react";
import { Button, Input, toast } from "@/components/ui";
import {
  type ClinicContactSettings,
  updateClinicContactSettings,
} from "./clinic-contact-actions";

type ClinicContactFormProps = {
  initial: ClinicContactSettings;
  canWrite: boolean;
};

export function ClinicContactForm({ initial, canWrite }: ClinicContactFormProps) {
  const [whatsapp, setWhatsapp] = useState(initial.contact_whatsapp ?? "");
  const [instagram, setInstagram] = useState(initial.contact_instagram ?? "");
  const [email, setEmail] = useState(initial.contact_email ?? "");
  const [address, setAddress] = useState(initial.contact_address ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) return;

    try {
      setIsSaving(true);
      await updateClinicContactSettings({
        contact_whatsapp: whatsapp,
        contact_instagram: instagram,
        contact_email: email,
        contact_address: address,
      });
      toast.success("Contatos do rodapé atualizados.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <p className="text-sm text-muted-foreground">
        Aparecem no rodapé de receitas, atestados e guias. Linhas vazias não são
        exibidas no PDF.
      </p>

      <label className="block space-y-1.5">
        <span className="text-sm text-muted-foreground">WhatsApp</span>
        <Input
          value={whatsapp}
          onChange={(event) => setWhatsapp(event.target.value)}
          placeholder="(11) 98765-4321"
          disabled={!canWrite || isSaving}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm text-muted-foreground">Instagram</span>
        <Input
          value={instagram}
          onChange={(event) => setInstagram(event.target.value)}
          placeholder="@sua.clinica"
          disabled={!canWrite || isSaving}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm text-muted-foreground">E-mail</span>
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="contato@clinica.com.br"
          disabled={!canWrite || isSaving}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm text-muted-foreground">Endereço</span>
        <Input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Rua, número — cidade/UF"
          disabled={!canWrite || isSaving}
        />
      </label>

      {canWrite && (
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar contatos"}
        </Button>
      )}
    </form>
  );
}
