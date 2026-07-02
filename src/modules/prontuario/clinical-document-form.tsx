"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, toast } from "@/components/ui";
import { previewClinicalDocument } from "./actions";
import { ClinicalPdfPreviewModal } from "./clinical-pdf-preview-modal";
import type { ClinicalDocumentTemplate } from "./templates/types";
import { TEMPLATE_MAP } from "./generate-clinical-pdf";

const textareaClassName =
  "flex min-h-[100px] w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

type ClinicalDocumentFormProps = {
  patientId: string;
  canWrite: boolean;
};

export function ClinicalDocumentForm({
  patientId,
  canWrite,
}: ClinicalDocumentFormProps) {
  const [template, setTemplate] = useState<ClinicalDocumentTemplate>("atestado");
  const [customTitle, setCustomTitle] = useState("");
  const [medications, setMedications] = useState("");
  const [daysOff, setDaysOff] = useState("1");
  const [reason, setReason] = useState("");
  const [exams, setExams] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ title: string; pdfBase64: string } | null>(
    null,
  );

  function buildInput() {
    return {
      template,
      customTitle,
      medications,
      daysOff: Number(daysOff),
      reason,
      exams,
    };
  }

  async function handlePreview() {
    if (!canWrite) return;

    try {
      setIsPreviewing(true);
      const result = await previewClinicalDocument(patientId, buildInput());
      setPreview(result);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Novo documento clínico
            </h2>
            <p className="text-sm text-muted-foreground">
              Gere receita, atestado ou guia de exame em PDF com assinatura visual.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(TEMPLATE_MAP) as ClinicalDocumentTemplate[]).map((id) => (
              <Button
                key={id}
                type="button"
                variant={template === id ? "default" : "outline"}
                disabled={!canWrite || isPreviewing}
                onClick={() => setTemplate(id)}
              >
                {TEMPLATE_MAP[id].label}
              </Button>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm text-muted-foreground">
              Título personalizado (opcional)
            </span>
            <Input
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder="Deixe em branco para título automático"
              disabled={!canWrite || isPreviewing}
              maxLength={200}
            />
          </label>

          {template === "receita" && (
            <label className="block space-y-1.5">
              <span className="text-sm text-muted-foreground">Prescrição</span>
              <textarea
                value={medications}
                onChange={(event) => setMedications(event.target.value)}
                className={textareaClassName}
                placeholder="Medicamentos, posologia e orientações..."
                disabled={!canWrite || isPreviewing}
                required
              />
            </label>
          )}

          {template === "atestado" && (
            <>
              <label className="block space-y-1.5">
                <span className="text-sm text-muted-foreground">
                  Dias de afastamento
                </span>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={daysOff}
                  onChange={(event) => setDaysOff(event.target.value)}
                  disabled={!canWrite || isPreviewing}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-muted-foreground">
                  Motivo (opcional)
                </span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className={textareaClassName}
                  placeholder="Ex.: procedimento odontológico"
                  disabled={!canWrite || isPreviewing}
                />
              </label>
            </>
          )}

          {template === "guia" && (
            <label className="block space-y-1.5">
              <span className="text-sm text-muted-foreground">
                Exames solicitados
              </span>
              <textarea
                value={exams}
                onChange={(event) => setExams(event.target.value)}
                className={textareaClassName}
                placeholder="Liste os exames ou procedimentos..."
                disabled={!canWrite || isPreviewing}
                required
              />
            </label>
          )}

          {!canWrite && (
            <p className="text-sm text-amber-400">
              Assinatura inativa — geração bloqueada até regularizar o plano.
            </p>
          )}

          <Button
            type="button"
            disabled={!canWrite || isPreviewing}
            onClick={() => void handlePreview()}
          >
            {isPreviewing ? "Gerando preview..." : "Visualizar preview"}
          </Button>
        </CardContent>
      </Card>

      <ClinicalPdfPreviewModal
        open={preview !== null}
        title={preview?.title ?? ""}
        pdfBase64={preview?.pdfBase64 ?? null}
        onClose={() => setPreview(null)}
      />
    </>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível gerar o preview.";
}
