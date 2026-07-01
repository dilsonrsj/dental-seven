"use client";

import { useState } from "react";
import { requestAccountClosure } from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EncerramentoFormProps = {
  clinicName: string;
};

export function EncerramentoForm({ clinicName }: EncerramentoFormProps) {
  const [nameConfirm, setNameConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await requestAccountClosure(nameConfirm, password);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Recomendamos exportar seus dados antes. A conta será encerrada (soft
        delete) e você perderá acesso.
      </p>
      <Input
        placeholder={`Digite: ${clinicName}`}
        value={nameConfirm}
        onChange={(e) => setNameConfirm(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Sua senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="outline" disabled={loading}>
        {loading ? "Encerrando…" : "Encerrar conta"}
      </Button>
    </form>
  );
}
