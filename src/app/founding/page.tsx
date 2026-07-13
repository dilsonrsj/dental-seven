import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { DentalSevenLogo } from "@/components/brand/dental-seven-logo";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import { validateFoundingAccess } from "@/lib/founding/gate";
import { FoundingForm } from "./founding-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dental Seven — Programa Founding Members",
  description:
    "Convite exclusivo para dentistas testarem o Dental Seven antes do lançamento — DR7 Performance",
  robots: { index: false, follow: false },
};

export default async function FoundingPage() {
  const access = await validateFoundingAccess();

  return (
    <div className="relative min-h-screen bg-[#07090f] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-20" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklab, var(--primary) 22%, transparent), transparent)",
        }}
      />

      <header className="relative z-10 border-b border-border/40 bg-[#07090f]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:py-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <DentalSevenLogo
              variant="mark"
              surface="transparent"
              height={56}
              priority
              className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
            />
            <span className="font-display text-lg font-bold tracking-tight text-[#F1F5F9] sm:text-xl">
              Dental Seven
            </span>
          </div>
          {access.valid ? (
            <Link
              href="/cadastro"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Ir para cadastro
            </Link>
          ) : null}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 pb-16">
        <Suspense fallback={<p className="text-center text-muted-foreground">Carregando…</p>}>
          <FoundingForm initialAccessGranted={access.valid} />
        </Suspense>

        <footer className="mt-12 flex flex-col items-center gap-3 border-t border-border/40 pt-8">
          <Dr7Logo variant="on-dark" height={32} />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            DR7 Performance
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Versão beta · uso sujeito aos{" "}
            <Link href="/termos" className="text-primary hover:underline">
              Termos
            </Link>{" "}
            e{" "}
            <Link href="/privacidade" className="text-primary hover:underline">
              Privacidade
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
