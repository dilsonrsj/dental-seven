"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, Printer, X } from "lucide-react";
import { Button } from "@/components/ui";
import {
  downloadPdfUrl,
  openPdfUrl,
  prefersExternalPdfViewer,
} from "./pdf-open";

type ClinicalPdfPreviewModalProps = {
  open: boolean;
  title: string;
  pdfBase64: string | null;
  onClose: () => void;
  onSave?: () => void;
  isSaving?: boolean;
};

export function ClinicalPdfPreviewModal({
  open,
  title,
  pdfBase64,
  onClose,
  onSave,
  isSaving = false,
}: ClinicalPdfPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [useExternalViewer, setUseExternalViewer] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUseExternalViewer(prefersExternalPdfViewer());
  }, []);

  useEffect(() => {
    if (!open || !pdfBase64) {
      setObjectUrl(null);
      return;
    }

    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, pdfBase64]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted || !objectUrl) return null;

  function handlePrintOrOpen() {
    if (!objectUrl) return;
    if (useExternalViewer) {
      openPdfUrl(objectUrl);
      return;
    }
    openPdfUrl(objectUrl);
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <header className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">
            Preview do documento clínico
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onSave && (
            <Button
              type="button"
              className="h-10 flex-1 sm:flex-none"
              disabled={isSaving}
              onClick={onSave}
            >
              {isSaving ? "Salvando..." : "Salvar no prontuário"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2"
            onClick={handlePrintOrOpen}
          >
            {useExternalViewer ? (
              <ExternalLink className="h-4 w-4" aria-hidden />
            ) : (
              <Printer className="h-4 w-4" aria-hidden />
            )}
            <span className="sm:hidden">
              {useExternalViewer ? "Abrir" : "Imprimir"}
            </span>
            <span className="hidden sm:inline">
              {useExternalViewer ? "Abrir / imprimir" : "Imprimir"}
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2"
            onClick={() => downloadPdfUrl(objectUrl, title)}
          >
            <Download className="h-4 w-4" aria-hidden />
            Baixar
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        {useExternalViewer ? (
          <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No celular o PDF abre no visualizador do aparelho. Use Abrir para
              ver e imprimir, ou Baixar para salvar o arquivo.
            </p>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="h-11 w-full gap-2"
                onClick={() => openPdfUrl(objectUrl)}
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Abrir PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2"
                onClick={() => downloadPdfUrl(objectUrl, title)}
              >
                <Download className="h-4 w-4" aria-hidden />
                Baixar PDF
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            title={title}
            src={objectUrl}
            className="h-full min-h-[60vh] w-full max-w-5xl rounded-xl border border-border bg-white"
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
