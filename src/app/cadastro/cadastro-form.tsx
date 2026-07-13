"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PLAN_LABELS,
  PLAN_PRICES,
  PLAN_TAGLINES,
  type PlanKey,
} from "@/lib/billing/plans";
import { signupClinic } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PLANS: PlanKey[] = ["essencial", "conecta", "inteligente", "completo"];

const BETA_MODULE_BANDS = [
  { band: "Essencial", modules: "Agenda, Pacientes" },
  { band: "Conecta", modules: "+ Prontuário, Procedimentos" },
  { band: "Inteligente", modules: "+ Estoque, Financeiro, Convênios" },
  {
    band: "Completo (produção futura)",
    modules: "+ Fornecedores, WhatsApp, IA",
  },
] as const;

type CadastroFormProps = {
  betaMode?: boolean;
  defaults?: {
    clinicName: string;
    adminName: string;
    email: string;
  };
};

export function CadastroForm({ betaMode = false, defaults }: CadastroFormProps) {
  const router = useRouter();
  const [clinicName, setClinicName] = useState(defaults?.clinicName ?? "");
  const [adminName, setAdminName] = useState(defaults?.adminName ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [password, setPassword] = useState("");
  const [planKey, setPlanKey] = useState<PlanKey>("conecta");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
        planKey: betaMode ? "inteligente" : planKey,
        acceptedTerms,
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

      {betaMode ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface/80 px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            O que você pode testar na beta
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {BETA_MODULE_BANDS.map(({ band, modules }) => (
              <li key={band} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                <span className="shrink-0 font-medium text-foreground">{band}</span>
                <span>{modules}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Na beta você entra com o pacote Inteligente para testar o máximo da
            clínica digital, exceto WhatsApp e IA. Preços e cobrança real entram
            na produção comercial.
          </p>
        </div>
      ) : (
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
                  <span className="block text-xs font-normal text-muted-foreground">
                    {PLAN_TAGLINES[key]}
                  </span>
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
      )}

      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 accent-primary"
          required
        />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" className="text-primary hover:underline" target="_blank">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            className="text-primary hover:underline"
            target="_blank"
          >
            Política de Privacidade
          </Link>
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" disabled={loading || !acceptedTerms}>
        {loading
          ? "Criando conta…"
          : betaMode
            ? "Criar conta e começar"
            : "Começar trial grátis"}
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
