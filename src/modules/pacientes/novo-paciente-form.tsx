"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPatient } from "@/modules/pacientes/actions";
import { Button, Card, Input } from "@/components/ui";

export function NovoPacienteForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const patient = await createPatient({
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
        whatsapp: String(form.get("whatsapp") ?? "") || undefined,
        birth_date: String(form.get("birth_date") ?? "") || undefined,
        notes: String(form.get("notes") ?? "") || undefined,
      });
      router.push(`/pacientes/${patient.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="name" placeholder="Nome completo *" required />
        <Input name="phone" placeholder="Telefone" />
        <Input name="whatsapp" placeholder="WhatsApp" />
        <Input name="birth_date" type="date" placeholder="Nascimento" />
        <Input name="notes" placeholder="Anotações iniciais" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando…" : "Cadastrar paciente"}
        </Button>
      </form>
    </Card>
  );
}
