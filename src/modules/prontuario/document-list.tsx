"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { FileImage, FileText, MessageCircle, Upload } from "lucide-react";
import { Button, Card, CardContent, toast } from "@/components/ui";
import {
  getDocumentDownloadUrl,
  sendDocumentToWhatsAppThread,
  uploadPatientDocument,
} from "./actions";
import { DocumentViewerModal } from "./document-viewer-modal";
import type { PatientDocumentListItem } from "./types";
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES, isPreviewableMimeType } from "./validation";

type DocumentListProps = {
  patientId: string;
  initialDocuments: PatientDocumentListItem[];
  onDocumentsChange?: (documents: PatientDocumentListItem[]) => void;
};

export function DocumentList({
  patientId,
  initialDocuments,
  onDocumentsChange,
}: DocumentListProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] =
    useState<PatientDocumentListItem[]>(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<string | null>(null);
  const [viewerDocument, setViewerDocument] =
    useState<PatientDocumentListItem | null>(null);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const updateDocuments = useCallback(
    (updater: (current: PatientDocumentListItem[]) => PatientDocumentListItem[]) => {
      setDocuments((current) => {
        const next = updater(current);
        onDocumentsChange?.(next);
        return next;
      });
    },
    [onDocumentsChange],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        setIsUploading(true);
        const created = await uploadPatientDocument(patientId, formData);
        updateDocuments((current) => [created, ...current]);
        toast.success("Documento enviado com sucesso.");
        router.refresh();
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [patientId, router, updateDocuments],
  );

  async function handleDownload(documentId: string) {
    try {
      setDownloadingId(documentId);
      const url = await getDocumentDownloadUrl(documentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleSendWhatsApp(document: PatientDocumentListItem) {
    try {
      setSendingWhatsAppId(document.id);
      await sendDocumentToWhatsAppThread(patientId, document.id);
      toast.success('Mensagem simulada enviada. Abra o módulo WhatsApp para ver.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSendingWhatsAppId(null);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void uploadFile(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Importar documentos
            </h2>
            <p className="text-sm text-muted-foreground">
              PDF, JPG ou PNG — até {formatFileSize(MAX_FILE_BYTES)} por arquivo.
              Ideal para histórico de outras plataformas, laudos e exames.
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:border-primary/50"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <Upload className="h-8 w-8 text-primary" aria-hidden />
            <p className="mt-3 text-sm font-medium">
              {isUploading
                ? "Enviando documento..."
                : "Arraste um arquivo ou clique para selecionar"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Formatos aceitos: PDF, JPG, PNG
            </p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_MIME_TYPES.join(",")}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Documentos</h2>
            <p className="text-sm text-muted-foreground">
              {documents.length} documento(s) neste prontuário.
            </p>
          </div>

          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum documento ainda. Arraste PDF ou imagem para importar o
              histórico do paciente.
            </p>
          ) : (
            <ul className="space-y-3">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <DocumentIcon mimeType={document.mime_type} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{document.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMimeLabel(document.mime_type)} ·{" "}
                        {formatSourceLabel(document.source)} ·{" "}
                        {formatFileSize(document.file_size_bytes)} ·{" "}
                        {formatDateTime(document.created_at)}
                      </p>
                      {document.uploader_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Enviado por {document.uploader_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {isPreviewableMimeType(document.mime_type) && (
                      <Button
                        type="button"
                        className="shrink-0"
                        onClick={() => setViewerDocument(document)}
                      >
                        Visualizar
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      disabled={downloadingId === document.id}
                      onClick={() => void handleDownload(document.id)}
                    >
                      {downloadingId === document.id ? "Abrindo..." : "Baixar"}
                    </Button>
                    {document.source === "generated" && (
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 gap-2"
                        disabled={sendingWhatsAppId === document.id}
                        onClick={() => void handleSendWhatsApp(document)}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden />
                        {sendingWhatsAppId === document.id
                          ? "Enviando..."
                          : "WhatsApp"}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DocumentViewerModal
        open={viewerDocument !== null}
        selectedDocument={viewerDocument}
        onClose={() => setViewerDocument(null)}
      />
    </div>
  );
}

function DocumentIcon({ mimeType }: { mimeType: string }) {
  const isPdf = mimeType === "application/pdf";
  const Icon = isPdf ? FileText : FileImage;

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" aria-hidden />
    </div>
  );
}

function formatMimeLabel(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "image/jpeg") return "JPG";
  if (mimeType === "image/png") return "PNG";
  return mimeType;
}

function formatSourceLabel(source: PatientDocumentListItem["source"]) {
  if (source === "generated") return "Gerado";
  if (source === "clinical") return "Clínico";
  return "Importado";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}
