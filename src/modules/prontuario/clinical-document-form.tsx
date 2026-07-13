"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardContent, Input, toast } from "@/components/ui";
import { portugueseProseFieldProps } from "@/lib/i18n/prose-field";
import {
  generateClinicalDocument,
  previewClinicalDocument,
} from "./actions";
import { ClinicalPdfPreviewModal } from "./clinical-pdf-preview-modal";
import type { PatientDocumentListItem } from "./types";
import type { ClinicalDocumentTemplate } from "./templates/types";
import { TEMPLATE_MAP } from "./templates/registry";
import {
  formatDentalCidOption,
  groupDentalCidsByCategory,
} from "./data/dental-cid-list";

const textareaClassName =
  "flex min-h-[100px] w-full rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50";

type ClinicalDocumentFormProps = {
  patientId: string;
  canWrite: boolean;
  onDocumentCreated?: (document: PatientDocumentListItem) => void;
};

export function ClinicalDocumentForm({
  patientId,
  canWrite,
  onDocumentCreated,
}: ClinicalDocumentFormProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<ClinicalDocumentTemplate>("atestado");
  const [customTitle, setCustomTitle] = useState("");
  const [medications, setMedications] = useState("");
  const [daysOff, setDaysOff] = useState("1");
  const [reason, setReason] = useState("");
  const [cidPatientAuthorized, setCidPatientAuthorized] = useState(false);
  const [cidCode, setCidCode] = useState("");
  const [exams, setExams] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      cidPatientAuthorized,
      cidCode: cidPatientAuthorized ? cidCode : undefined,
    };
  }

  async function handleSave() {
    if (!canWrite) return;

    try {
      setIsSaving(true);
      const created = await generateClinicalDocument(patientId, buildInput());
      onDocumentCreated?.(created);
      setPreview(null);
      toast.success("Documento salvo no prontuário.");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  const isBusy = isPreviewing || isSaving;
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
                variant={template === id ? "primary" : "outline"}
                disabled={!canWrite || isBusy}
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
              disabled={!canWrite || isBusy}
              maxLength={200}
            />
          </label>

          {template === "receita" && (
            <label className="block space-y-1.5">
              <span className="text-sm text-muted-foreground">Prescrição</span>
              <textarea
                {...portugueseProseFieldProps}
                value={medications}
                onChange={(event) => setMedications(event.target.value)}
                className={textareaClassName}
                placeholder="Medicamentos, posologia e orientações..."
                disabled={!canWrite || isBusy}
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
                  disabled={!canWrite || isBusy}
                  required
                />
              </label>
              <div className="space-y-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={cidPatientAuthorized}
                    onChange={(event) => {
                      setCidPatientAuthorized(event.target.checked);
                      if (!event.target.checked) setCidCode("");
                    }}
                    disabled={!canWrite || isBusy}
                    className="mt-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    Paciente autoriza inclusão do CID no atestado
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Conforme orientação do CFO, o CID só deve constar no atestado com
                  autorização expressa do paciente.
                </p>
              </div>
              {cidPatientAuthorized && (
                <label className="block space-y-1.5">
                  <span className="text-sm text-muted-foreground">CID-10</span>
                  <select
                    value={cidCode}
                    onChange={(event) => setCidCode(event.target.value)}
                    disabled={!canWrite || isBusy}
                    required
                    className="flex h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione o CID</option>
                    {groupDentalCidsByCategory().map((group) => (
                      <optgroup key={group.category} label={group.category}>
                        {group.entries.map((entry) => (
                          <option key={entry.code} value={entry.code}>
                            {formatDentalCidOption(entry)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              )}
              <label className="block space-y-1.5">
                <span className="text-sm text-muted-foreground">
                  Motivo (opcional)
                </span>
                <textarea
                  {...portugueseProseFieldProps}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className={textareaClassName}
                  placeholder="Ex.: procedimento odontológico"
                  disabled={!canWrite || isBusy}
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
                {...portugueseProseFieldProps}
                value={exams}
                onChange={(event) => setExams(event.target.value)}
                className={textareaClassName}
                placeholder="Liste os exames ou procedimentos..."
                disabled={!canWrite || isBusy}
                required
              />
            </label>
          )}

          {!canWrite && (
            <p className="text-sm text-amber-400">
              Assinatura inativa — geração bloqueada até regularizar o plano.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!canWrite || isBusy}
              onClick={() => void handlePreview()}
            >
              {isPreviewing ? "Gerando preview..." : "Visualizar preview"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canWrite || isBusy}
              onClick={() => void handleSave()}
            >
              {isSaving ? "Salvando..." : "Salvar PDF no prontuário"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ClinicalPdfPreviewModal
        open={preview !== null}
        title={preview?.title ?? ""}
        pdfBase64={preview?.pdfBase64 ?? null}
        onClose={() => setPreview(null)}
        onSave={canWrite ? () => void handleSave() : undefined}
        isSaving={isSaving}
      />
    </>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível gerar o preview.";
}
