"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { acceptTerms } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "loading" | "login" | "invite";
type InviteType = "invite" | "recovery";

type EntrarFormProps = {
  betaMode?: boolean;
};

function parseHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : "";
  return new URLSearchParams(hash);
}

export function EntrarForm({ betaMode = false }: EntrarFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("loading");
  const [inviteType, setInviteType] = useState<InviteType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function handleAuthCallback() {
      const hashParams = parseHashParams();
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (!accessToken || !refreshToken) {
        setMode("login");
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      window.history.replaceState(null, "", window.location.pathname);

      if (sessionError) {
        setError("Link de convite inválido ou expirado. Peça um novo convite.");
        setMode("login");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setEmail(user.email);
      }

      if (type === "invite" || type === "recovery") {
        setInviteType(type);
        setMode("invite");
        return;
      }

      router.push("/agenda");
      router.refresh();
    }

    void handleAuthCallback();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(
        "E-mail ou senha inválidos. Se você veio de um convite, abra o link do e-mail novamente.",
      );
      return;
    }

    router.push("/agenda");
    router.refresh();
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use pelo menos 8 caracteres na senha.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (inviteType === "invite" && !acceptedTerms) {
      setError("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    if (inviteType === "invite") {
      const termsResult = await acceptTerms({ acceptedTerms: true });
      if (!termsResult.ok) {
        setLoading(false);
        setError(termsResult.error);
        return;
      }
    }

    setLoading(false);

    router.push("/agenda");
    router.refresh();
  }

  if (mode === "loading") {
    return (
      <p className="w-full max-w-sm text-center text-sm text-muted-foreground">
        Validando convite…
      </p>
    );
  }

  if (mode === "invite") {
    return (
      <form
        onSubmit={handleSetPassword}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <div className="text-center">
          <p className="font-medium text-foreground">Aceitar convite</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {email
              ? `Defina sua senha para ${email}`
              : "Defina sua senha para entrar na clínica"}
          </p>
        </div>
        <Input
          type="password"
          placeholder="Nova senha (mín. 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Input
          type="password"
          placeholder="Confirmar senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        {inviteType === "invite" && (
          <label className="flex cursor-pointer items-start gap-3 text-left text-sm text-muted-foreground">
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
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          size="lg"
          disabled={loading || (inviteType === "invite" && !acceptedTerms)}
        >
          {loading ? "Salvando…" : "Criar senha e entrar"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="flex w-full max-w-sm flex-col gap-4">
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
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {betaMode ? (
          <>
            Ainda não tem acesso?{" "}
            <Link href="/founding" className="text-primary hover:underline">
              Programa Founding Members
            </Link>
          </>
        ) : (
          <>
            Novo por aqui?{" "}
            <Link href="/cadastro" className="text-primary hover:underline">
              Criar conta
            </Link>
          </>
        )}
      </p>
      <p className="text-center text-xs text-muted-foreground">
        <Link href="/termos" className="hover:text-foreground hover:underline">
          Termos de Uso
        </Link>
        {" · "}
        <Link href="/privacidade" className="hover:text-foreground hover:underline">
          Privacidade
        </Link>
      </p>
    </form>
  );
}
