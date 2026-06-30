import type { Metadata } from "next";
import Link from "next/link";
import { DentalSevenLogo } from "@/components/brand/dental-seven-logo";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEMO_STEPS,
  DEMO_VS_PRODUCT,
  FUTURE_MODULES,
  MVP_MODULES,
  PLANS,
} from "@/lib/commercial/visao-content";
import {
  PRICING_RULES,
} from "@/lib/commercial/pricing-source";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dental Seven — Visão do produto",
  description:
    "Demonstração e visão completa do Dental Seven para clínicas odontológicas — DR7 Performance",
};

export default function VisaoPage() {
  const demoPassword = process.env.DEMO_PASSWORD?.trim();

  return (
    <div className="min-h-screen bg-[#0a0c10] text-foreground">
      <header className="border-b border-border/60 bg-[#0a0c10]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5">
          <DentalSevenLogo
            variant="full"
            surface="entrar"
            height={48}
            priority
            className="h-10 w-auto"
          />
          <Link href="/entrar">
            <Button size="md" className="rounded-full px-5">
              Acessar demo
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 pb-16">
        <section className="animate-fade-in-up space-y-4 text-center">
          <Badge>Demonstração interativa</Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            O sistema completo para sua clínica
          </h1>
          <p className="text-muted-foreground">
            Clínicas com 1 a 3 dentistas, sem recepção — agenda, pacientes,
            WhatsApp e gestão no mesmo lugar. Desenvolvido pela{" "}
            <span className="text-foreground">DR7 Performance</span>.
          </p>
        </section>

        <section className="mt-10">
          <Card className="border-primary/40 bg-surface/80">
            <CardHeader>
              <CardTitle className="text-primary">Acesso à demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use a senha abaixo em{" "}
                <Link href="/entrar" className="text-primary hover:underline">
                  Acessar demo
                </Link>
                . Os dados são fictícios da <em>Clínica Sorriso Norte</em>.
              </p>
              {demoPassword ? (
                <div className="rounded-xl border border-primary/50 bg-[#141820] px-5 py-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Senha da demonstração
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold tracking-wider text-primary">
                    {demoPassword}
                  </p>
                </div>
              ) : (
                <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  Senha não configurada no servidor. Defina{" "}
                  <code className="text-xs">DEMO_PASSWORD</code> nas variáveis de
                  ambiente.
                </p>
              )}
              <Link href="/entrar" className="block">
                <Button size="lg" className="w-full rounded-full">
                  Ir para a demo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-xl font-semibold">
            O que você testa hoje
          </h2>
          <div className="grid gap-4 sm:grid-cols-1">
            {MVP_MODULES.map((mod) => (
              <Card key={mod.title}>
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                    <Badge className="border-muted-foreground/30 text-muted-foreground">
                      Na demo
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mod.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-xl font-semibold">
            Roteiro rápido (5 minutos)
          </h2>
          <Card>
            <CardContent className="pt-6">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                {DEMO_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-xl font-semibold">
            Plataforma completa — o que teremos
          </h2>
          <p className="text-sm text-muted-foreground">
            Além da demo de hoje, o Dental Seven evoluirá com estes módulos. O
            dentista usa tudo no celular ou no computador, entre consultas.
          </p>
          <div className="grid gap-4">
            {FUTURE_MODULES.map((mod) => (
              <Card key={mod.title}>
                <CardContent className="space-y-2 pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                    <Badge>Plano {mod.plan}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {mod.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-xl font-semibold">Planos previstos</h2>
          <p className="text-sm text-muted-foreground">
            Trial de {PRICING_RULES.trialDays} dias grátis (sem cartão) no
            lançamento comercial. Plano Essencial: até{" "}
            {PRICING_RULES.dentistsIncluded.essencial} dentista. Planos Conecta+:
            até {PRICING_RULES.dentistsIncluded.conectaPlus} dentistas · dentista
            extra: {PRICING_RULES.extraDentistMonthly}/mês (a partir do 4º).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlight
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30 sm:col-span-2"
                    : undefined
                }
              >
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <span className="font-display text-lg font-bold text-primary">
                      {plan.price}
                      <span className="text-xs font-normal text-muted-foreground">
                        /mês
                      </span>
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {plan.tagline}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  {plan.addsFromPrevious && (
                    <p className="text-xs font-medium text-primary">
                      {plan.addsFromPrevious}
                    </p>
                  )}
                  <ul className="space-y-1.5 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-xl font-semibold">
            Demo hoje × produto final
          </h2>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Hoje (demo)</th>
                    <th className="pb-3 font-medium">Produto completo</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {DEMO_VS_PRODUCT.map((row) => (
                    <tr key={row.today} className="border-b border-border/60">
                      <td className="py-3 pr-4 align-top">{row.today}</td>
                      <td className="py-3 align-top text-foreground">
                        {row.future}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>

        <section className="mt-12">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="space-y-4 pt-6 text-center">
              <p className="font-display text-lg font-semibold">
                Pronto para explorar?
              </p>
              <p className="text-sm text-muted-foreground">
                Entre com a senha da demo e navegue como se fosse sua clínica.
              </p>
              <Link href="/entrar">
                <Button size="lg" className="rounded-full px-8">
                  Acessar demonstração
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 opacity-90">
          <Dr7Logo variant="on-dark" height={36} />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Desenvolvido por DR7 Performance
          </p>
        </div>
      </footer>
    </div>
  );
}
