import { redirect } from "next/navigation";
import { DentalSevenLogo } from "@/components/brand/dental-seven-logo";
import { Dr7Logo } from "@/components/brand/dr7-logo";
import {
  isBetaGateEnabled,
  markFoundingAccessed,
  validateFoundingAccess,
} from "@/lib/founding/gate";
import { CadastroForm } from "./cadastro-form";

export default async function CadastroPage() {
  const betaMode = isBetaGateEnabled();
  let founderDefaults:
    | {
        clinicName: string;
        adminName: string;
        email: string;
      }
    | undefined;

  if (betaMode) {
    const access = await validateFoundingAccess();
    if (!access.valid) {
      redirect("/founding");
    }
    await markFoundingAccessed(access.founder.access_token);
    founderDefaults = {
      clinicName: access.founder.clinic_name,
      adminName: access.founder.full_name,
      email: access.founder.email,
    };
  }

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
        {betaMode ? (
          <div className="w-full rounded-xl border border-amber-500/50 bg-amber-500/15 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-amber-200">
              Beta fechada — versão de testes
            </p>
            <p className="mt-1 text-xs text-amber-100/80">
              Teste o produto e envie feedback. Alguns recursos ainda estão em
              desenvolvimento.
            </p>
          </div>
        ) : null}
        <p className="text-center text-sm text-muted-foreground">
          {betaMode
            ? "Crie sua clínica e comece a testar."
            : "Crie sua clínica em minutos. Teste grátis por 7 dias."}
        </p>
        <CadastroForm betaMode={betaMode} defaults={founderDefaults} />
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
