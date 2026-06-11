import { DentalSevenWordmark } from "@/components/brand/dental-seven-wordmark";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import { EntrarForm } from "./entrar-form";

export default function EntrarPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#07090f] px-4">
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-20" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklab, var(--primary) 22%, transparent), transparent)",
        }}
      />
      <div className="relative z-10 flex animate-fade-in-up flex-col items-center gap-8 text-center">
        <DentalSevenWordmark />
        <p className="max-w-md text-sm text-muted-foreground">
          Demonstração — explore agenda, pacientes e WhatsApp
        </p>
        <EntrarForm />
        <div className="mt-8 flex flex-col items-center gap-2 opacity-80">
          <Dr7Logo height={36} />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Desenvolvido por DR7 Performance
          </p>
        </div>
      </div>
    </div>
  );
}
