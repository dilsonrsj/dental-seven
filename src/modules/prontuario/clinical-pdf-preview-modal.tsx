"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui";

type ClinicalPdfPreviewModalProps = {
  open: boolean;
  title: string;
  pdfBase64: string | null;
  onClose: () => void;
};

export function ClinicalPdfPreviewModal({
  open,
  title,
  pdfBase64,
  onClose,
}: ClinicalPdfPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">Preview do documento clínico</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2"
            onClick={() => window.open(objectUrl, "_blank", "noopener,noreferrer")}
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
        <iframe
          title={title}
          src={objectUrl}
          className="h-full min-h-[60vh] w-full max-w-5xl rounded-xl border border-border bg-white"
        />
      </div>
    </div>,
    document.body,
  );
}
