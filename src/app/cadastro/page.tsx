import { DentalSevenLogo } from "@/components/brand/dental-seven-logo";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import { CadastroForm } from "./cadastro-form";

export default function CadastroPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#07090f] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-20" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklab, var(--primary) 22%, transparent), transparent)",
        }}
      />
      <div className="relative z-10 flex w-full max-w-md animate-fade-in-up flex-col items-center gap-6">
        <DentalSevenLogo
          variant="full"
          surface="transparent"
          height={160}
          priority
          className="h-auto w-auto max-w-[min(92vw,260px)]"
        />
        <p className="text-center text-sm text-muted-foreground">
          Crie sua clínica em minutos. Teste grátis por 7 dias.
        </p>
        <CadastroForm />
        <div className="flex flex-col items-center gap-2 opacity-90">
          <Dr7Logo variant="on-dark" height={36} />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            DR7 Performance
          </p>
        </div>
      </div>
    </div>
  );
}
