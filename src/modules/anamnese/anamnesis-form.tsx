"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, toast } from "@/components/ui";
import { portugueseProseFieldProps } from "@/lib/i18n/prose-field";
import { computeAnamnesisAlerts } from "./alerts";
import { upsertPatientAnamnesis } from "./anamnesis-actions";
import { AnamnesisSummary } from "./anamnesis-summary";
import {
  ANAMNESIS_SECTION_LABELS,
  ANAMNESIS_SECTION_ORDER,
  emptyAnamnesisResponses,
  fieldsForSection,
  type AnamnesisResponses,
} from "./template-v1";

const textareaClassName =
  "flex min-h-[88px] w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

type AnamnesisFormProps = {
  patientId: string;
  initialResponses: AnamnesisResponses | null;
  canWrite: boolean;
};

export function AnamnesisForm({
  patientId,
  initialResponses,
  canWrite,
}: AnamnesisFormProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<AnamnesisResponses>(
    () => initialResponses ?? emptyAnamnesisResponses(),
  );
  const [isSaving, setIsSaving] = useState(false);

  const alerts = useMemo(() => computeAnamnesisAlerts(responses), [responses]);

  function setValue(key: string, value: boolean | string) {
    setResponses((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) return;

    try {
      setIsSaving(true);
      await upsertPatientAnamnesis(patientId, responses);
      toast.success("Anamnese salva.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <AnamnesisSummary badges={alerts.badges} />

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {ANAMNESIS_SECTION_ORDER.map((section) => (
          <Card key={section}>
            <CardContent className="space-y-4">
              <h2 className="font-display text-lg font-semibold">
                {ANAMNESIS_SECTION_LABELS[section]}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {fieldsForSection(section).map((field) => {
                  if (field.type === "boolean") {
                    const checked = responses[field.key] === true;
                    return (
                      <label
                        key={field.key}
                        className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setValue(field.key, event.target.checked)
                          }
                          disabled={!canWrite || isSaving}
                          className="h-5 w-5 rounded border-border accent-[var(--primary)] disabled:cursor-not-allowed"
                        />
                        <span className="text-sm font-medium">{field.label}</span>
                      </label>
                    );
                  }

                  return (
                    <label
                      key={field.key}
                      className="block space-y-1.5 sm:col-span-2"
                    >
                      <span className="text-sm text-muted-foreground">
                        {field.label}
                      </span>
                      <textarea
                        {...portugueseProseFieldProps}
                        value={String(responses[field.key] ?? "")}
                        onChange={(event) =>
                          setValue(field.key, event.target.value)
                        }
                        placeholder={field.placeholder}
                        className={textareaClassName}
                        disabled={!canWrite || isSaving}
                      />
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {!canWrite && (
          <p className="text-sm text-amber-400">
            Assinatura inativa — leitura permitida, mas alterações estão
            bloqueadas.
          </p>
        )}

        <Button type="submit" disabled={!canWrite || isSaving}>
          {isSaving ? "Salvando..." : "Salvar anamnese"}
        </Button>
      </form>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível salvar a anamnese.";
}
