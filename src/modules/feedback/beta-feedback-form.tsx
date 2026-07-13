"use client";

import { useState } from "react";
import Link from "next/link";
import { submitBetaFeedback } from "@/modules/feedback/actions";
import {
  BETA_FEEDBACK_TOP_MODULES,
  BETA_FEEDBACK_WOULD_USE,
  type BetaFeedbackTopModule,
  type BetaFeedbackWouldUse,
} from "@/modules/feedback/validation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { FEEDBACK_WHATSAPP } from "@/lib/founding/content";

const MODULE_LABELS: Record<BetaFeedbackTopModule, string> = {
  agenda: "Agenda",
  pacientes: "Pacientes",
  prontuario: "Prontuário",
  outro: "Outro",
};

const WOULD_USE_LABELS: Record<BetaFeedbackWouldUse, string> = {
  yes: "Sim",
  maybe: "Talvez",
  no: "Não",
};

export function BetaFeedbackForm() {
  const [nps, setNps] = useState<number | null>(null);
  const [topModule, setTopModule] = useState<BetaFeedbackTopModule | "">("");
  const [likedMost, setLikedMost] = useState("");
  const [blockedOrMissing, setBlockedOrMissing] = useState("");
  const [wouldUseToday, setWouldUseToday] = useState<BetaFeedbackWouldUse | "">(
    "",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function resetForm() {
    setNps(null);
    setTopModule("");
    setLikedMost("");
    setBlockedOrMissing("");
    setWouldUseToday("");
    setNotes("");
    setError("");
    setSubmitted(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (nps === null || !topModule || !wouldUseToday) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const result = await submitBetaFeedback({
        nps,
        topModule,
        likedMost,
        blockedOrMissing,
        wouldUseToday,
        notes,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success("Obrigado — recebemos seu feedback");
      setSubmitted(true);
    } catch {
      setError("Não foi possível enviar. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-surface px-5 py-6 text-center">
        <p className="text-lg font-semibold text-foreground">
          Obrigado — recebemos seu feedback
        </p>
        <p className="text-sm text-muted-foreground">
          Sua opinião ajuda a priorizar o que vem depois da beta.
        </p>
        <Button type="button" onClick={resetForm}>
          Enviar outro feedback
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          De 0 a 10: recomendaria o Dental Seven a um colega? *
        </legend>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 11 }, (_, i) => i).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setNps(value)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-medium transition-colors ${
                nps === value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          Qual módulo mais usou? *
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {BETA_FEEDBACK_TOP_MODULES.map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                topModule === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              <input
                type="radio"
                name="topModule"
                value={key}
                checked={topModule === key}
                onChange={() => setTopModule(key)}
                className="accent-primary"
              />
              {MODULE_LABELS[key]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          O que mais gostou? *
        </span>
        <textarea
          value={likedMost}
          onChange={(e) => setLikedMost(e.target.value)}
          maxLength={500}
          rows={3}
          required
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none ring-primary focus:ring-2"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          O que mais travou ou faltou? *
        </span>
        <textarea
          value={blockedOrMissing}
          onChange={(e) => setBlockedOrMissing(e.target.value)}
          maxLength={500}
          rows={3}
          required
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none ring-primary focus:ring-2"
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">
          Usaria no consultório real hoje? *
        </legend>
        <div className="flex flex-wrap gap-2">
          {BETA_FEEDBACK_WOULD_USE.map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                wouldUseToday === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              <input
                type="radio"
                name="wouldUseToday"
                value={key}
                checked={wouldUseToday === key}
                onChange={() => setWouldUseToday(key)}
                className="accent-primary"
              />
              {WOULD_USE_LABELS[key]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-foreground">
          Observações gerais{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none ring-primary focus:ring-2"
        />
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Enviando…" : "Enviar feedback"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Prefere WhatsApp?{" "}
        <Link
          href={FEEDBACK_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Falar com a DR7
        </Link>
      </p>
    </form>
  );
}
