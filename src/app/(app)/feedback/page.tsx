import { redirect } from "next/navigation";
import { isBetaGateEnabled } from "@/lib/founding/gate";
import { BETA_ENDS_SHORT } from "@/lib/founding/content";
import { BetaFeedbackForm } from "@/modules/feedback/beta-feedback-form";

export default function FeedbackPage() {
  if (!isBetaGateEnabled()) {
    redirect("/ajuda");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Enviar feedback
        </h1>
        <p className="text-sm text-muted-foreground">
          Beta até {BETA_ENDS_SHORT}. Suas respostas orientam o que priorizamos
          antes do lançamento.
        </p>
      </header>
      <BetaFeedbackForm />
    </div>
  );
}
