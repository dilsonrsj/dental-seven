"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PLAN_LABELS,
  PLAN_PRICES,
  type PlanKey,
} from "@/lib/billing/plans";
import { signupClinic } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PLANS: PlanKey[] = ["essencial", "conecta", "inteligente", "completo"];

export function CadastroForm() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [planKey, setPlanKey] = useState<PlanKey>("conecta");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signupClinic({
        clinicName,
        adminName,
        email,
        password,
        planKey,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push("/agenda");
      router.refresh();
    } catch {
      setError(
        "Não foi possível criar a conta. Verifique SUPABASE_SERVICE_ROLE_KEY no .env.local.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-4 text-left"
    >
      <Input
        placeholder="Nome da clínica"
        value={clinicName}
        onChange={(e) => setClinicName(e.target.value)}
        required
      />
      <Input
        placeholder="Seu nome (responsável)"
        value={adminName}
        onChange={(e) => setAdminName(e.target.value)}
        required
      />
      <Input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        type="password"
        placeholder="Senha (mín. 8 caracteres)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">Plano</legend>
        <div className="grid gap-2">
          {PLANS.map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                planKey === key
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="plan"
                  value={key}
                  checked={planKey === key}
                  onChange={() => setPlanKey(key)}
                  className="accent-primary"
                />
                <span className="font-medium">{PLAN_LABELS[key]}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                R$ {PLAN_PRICES[key]}/mês
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          7 dias grátis · sem cartão · cobrança só no 8º dia
        </p>
      </fieldset>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Criando conta…" : "Começar trial grátis"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
