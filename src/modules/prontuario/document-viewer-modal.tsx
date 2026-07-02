"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui";
import { getDocumentDownloadUrl } from "./actions";
import type { PatientDocumentListItem } from "./types";
import { isImageMimeType, isPdfMimeType } from "./validation";

const IMAGE_ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5] as const;

type DocumentViewerModalProps = {
  selectedDocument: PatientDocumentListItem | null;
  open: boolean;
  onClose: () => void;
};

export function DocumentViewerModal({
  selectedDocument,
  open,
  onClose,
}: DocumentViewerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageZoomIndex, setImageZoomIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetState = useCallback(() => {
    setSignedUrl(null);
    setError(null);
    setImageZoomIndex(0);
  }, []);

  useEffect(() => {
    if (!open || !selectedDocument) {
      resetState();
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setIsLoading(true);
      setError(null);
      try {
        const url = await getDocumentDownloadUrl(selectedDocument.id, 120);
        if (!cancelled) setSignedUrl(url);
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [open, selectedDocument, resetState]);

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

  async function handleDownload() {
    if (!selectedDocument) return;
    try {
      const url =
        signedUrl ?? (await getDocumentDownloadUrl(selectedDocument.id));
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(getErrorMessage(downloadError));
    }
  }

  if (!open || !mounted || !selectedDocument) return null;

  const isPdf = isPdfMimeType(selectedDocument.mime_type);
  const isImage = isImageMimeType(selectedDocument.mime_type);
  const imageScale = IMAGE_ZOOM_STEPS[imageZoomIndex];

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-semibold">
            {selectedDocument.title}
          </h2>
          <p className="text-xs text-muted-foreground">Visualização do documento</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isImage && signedUrl && !isLoading && !error && (
            <>
              <Button
                type="button"
                variant="outline"
                className="h-10 min-w-10 px-2"
                disabled={imageZoomIndex === 0}
                onClick={() =>
                  setImageZoomIndex((index) => Math.max(0, index - 1))
                }
                aria-label="Diminuir zoom"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-xs text-muted-foreground">
                {Math.round(imageScale * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                className="h-10 min-w-10 px-2"
                disabled={imageZoomIndex >= IMAGE_ZOOM_STEPS.length - 1}
                onClick={() =>
                  setImageZoomIndex((index) =>
                    Math.min(IMAGE_ZOOM_STEPS.length - 1, index + 1),
                  )
                }
                aria-label="Aumentar zoom"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2"
            onClick={() => void handleDownload()}
          >
            <Download className="h-4 w-4" aria-hidden />
            Baixar
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fechar visualização"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Carregando documento...</p>
        )}
        {error && (
          <p className="max-w-md text-center text-sm text-red-400">{error}</p>
        )}
        {!isLoading && !error && signedUrl && isPdf && (
          <iframe
            title={selectedDocument.title}
            src={signedUrl}
            className="h-full min-h-[60vh] w-full max-w-5xl rounded-xl border border-border bg-white"
          />
        )}
        {!isLoading && !error && signedUrl && isImage && (
          <div className="flex min-h-[50vh] w-full max-w-5xl items-center justify-center overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt={selectedDocument.title}
              className="max-w-none rounded-xl border border-border bg-white transition-transform duration-200"
              style={{ transform: `scale(${imageScale})` }}
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível carregar o documento.";
}
