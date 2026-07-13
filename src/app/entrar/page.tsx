import { DentalSevenLogo } from "@/components/brand/dental-seven-logo";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import { isBetaGateEnabled } from "@/lib/founding/gate";
import { EntrarForm } from "./entrar-form";

export const dynamic = "force-dynamic";

export default function EntrarPage() {
  const betaMode = isBetaGateEnabled();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c10] px-4">
      <div className="flex animate-fade-in-up flex-col items-center gap-8 text-center">
        <DentalSevenLogo
          variant="full"
          surface="entrar"
          height={200}
          priority
          className="h-auto max-w-[min(92vw,300px)] w-auto"
        />
        <p className="max-w-md text-sm text-muted-foreground">
          Sistema para clínicas odontológicas — agenda, pacientes e atendimento
        </p>
        <EntrarForm betaMode={betaMode} />
        <div className="mt-8 flex flex-col items-center gap-2 opacity-90">
          <Dr7Logo variant="on-dark" height={40} priority />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Desenvolvido por DR7 Performance
          </p>
        </div>
      </div>
    </div>
  );
}
