"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BRAZILIAN_STATES,
  FEEDBACK_WHATSAPP,
  FOUNDING_CONTENT,
} from "@/lib/founding/content";
import { submitFoundingForm } from "@/lib/founding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  initialAccessGranted: boolean;
};

export function FoundingForm({ initialAccessGranted }: Props) {
  const searchParams = useSearchParams();
  const inviteRef = searchParams.get("ref") ?? "";

  const [fullName, setFullName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [dentistCount, setDentistCount] = useState<"1" | "2" | "3+">("1");
  const [currentSystem, setCurrentSystem] = useState("");
  const [mainPain, setMainPain] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessGranted, setAccessGranted] = useState(initialAccessGranted);

  const formComplete = useMemo(() => {
    return (
      fullName.trim().length >= 3 &&
      clinicName.trim().length >= 2 &&
      city.trim().length >= 2 &&
      state.length === 2 &&
      whatsapp.replace(/\D/g, "").length >= 10 &&
      email.includes("@") &&
      mainPain.trim().length >= 10 &&
      acceptedTerms &&
      marketingConsent
    );
  }, [
    fullName,
    clinicName,
    city,
    state,
    whatsapp,
    email,
    mainPain,
    acceptedTerms,
    marketingConsent,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formComplete) return;

    setLoading(true);
    setError("");

    const result = await submitFoundingForm({
      fullName,
      clinicName,
      city,
      state,
      whatsapp,
      email,
      dentistCount,
      currentSystem,
      mainPain,
      inviteRef,
      acceptedTerms,
      marketingConsent,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setAccessGranted(true);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 text-center">
        <Badge className="mx-auto">{FOUNDING_CONTENT.eyebrow}</Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {FOUNDING_CONTENT.headline}
        </h1>
        <p className="text-muted-foreground">{FOUNDING_CONTENT.subheadline}</p>
        <p className="text-sm text-muted-foreground">{FOUNDING_CONTENT.welcome}</p>
        <div className="mx-auto max-w-2xl rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {FOUNDING_CONTENT.betaWindow.title}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {FOUNDING_CONTENT.betaWindow.body}
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-surface/60">
          <CardHeader>
            <CardTitle className="text-base text-primary">
              {FOUNDING_CONTENT.betaNote.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              {FOUNDING_CONTENT.betaNote.includes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-border/60 bg-[#0f1218] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Em breve
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {FOUNDING_CONTENT.betaNote.comingSoon.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-surface/60">
          <CardHeader>
            <CardTitle className="text-base text-primary">
              {FOUNDING_CONTENT.expectations.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              {FOUNDING_CONTENT.expectations.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">
                {FOUNDING_CONTENT.benefit.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {FOUNDING_CONTENT.benefit.body}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {accessGranted ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-4 py-8 text-center">
            <p className="font-display text-xl font-bold text-primary">
              {FOUNDING_CONTENT.successTitle}
            </p>
            <p className="text-sm text-muted-foreground">
              {FOUNDING_CONTENT.successBody}
            </p>
            <Link href="/cadastro">
              <Button size="lg" className="mt-2 rounded-full px-8">
                {FOUNDING_CONTENT.ctaEnabled}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60 bg-surface/80">
          <CardHeader>
            <CardTitle>{FOUNDING_CONTENT.formTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <Input
                className="sm:col-span-2"
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                className="sm:col-span-2"
                placeholder="Nome da clínica / consultório"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
              />
              <Input
                placeholder="Cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="h-11 rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">UF</option>
                {BRAZILIAN_STATES.map(({ uf, name }) => (
                  <option key={uf} value={uf}>
                    {uf} — {name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="WhatsApp (com DDD)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                inputMode="tel"
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
              <fieldset className="sm:col-span-2 space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  Quantos dentistas na clínica?
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(["1", "2", "3+"] as const).map((value) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors ${
                        dentistCount === value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="dentistCount"
                        value={value}
                        checked={dentistCount === value}
                        onChange={() => setDentistCount(value)}
                        className="sr-only"
                      />
                      {value === "3+" ? "3 ou mais" : value}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Input
                className="sm:col-span-2"
                placeholder="Sistema atual (opcional — ex.: planilha, nenhum, Codental…)"
                value={currentSystem}
                onChange={(e) => setCurrentSystem(e.target.value)}
              />
              <textarea
                className="sm:col-span-2 min-h-24 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="O que mais atrapalha sua rotina hoje?"
                value={mainPain}
                onChange={(e) => setMainPain(e.target.value)}
                required
              />

              <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 accent-primary"
                  required
                />
                <span>
                  Li e aceito os{" "}
                  <Link
                    href="/termos"
                    className="text-primary hover:underline"
                    target="_blank"
                  >
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

              <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 accent-primary"
                  required
                />
                <span>
                  Autorizo a DR7 Performance a entrar em contato sobre a beta, o
                  lançamento e condições de founding member.
                </span>
              </label>

              {error ? (
                <p className="sm:col-span-2 text-sm text-destructive">{error}</p>
              ) : null}

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full"
                  disabled={loading || !formComplete}
                >
                  {loading ? "Registrando…" : "Confirmar e liberar acesso"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {FOUNDING_CONTENT.whatsappFallback}{" "}
        <a
          href={FEEDBACK_WHATSAPP}
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir WhatsApp
        </a>
      </p>
    </div>
  );
}
