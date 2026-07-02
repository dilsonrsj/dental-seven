export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export type UploadFileLike = {
  type: string;
  size: number;
};

export function isAllowedMimeType(type: string): type is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type);
}

export function isPdfMimeType(type: string): boolean {
  return type === "application/pdf";
}

export function isImageMimeType(type: string): boolean {
  return type === "image/jpeg" || type === "image/png";
}

export function isPreviewableMimeType(type: string): boolean {
  return isPdfMimeType(type) || isImageMimeType(type);
}

export function assertAllowedUpload(file: UploadFileLike): void {
  if (file.size <= 0) {
    throw new Error("Arquivo vazio. Selecione um documento válido.");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Arquivo muito grande. O limite é 10 MB por documento.");
  }

  if (!isAllowedMimeType(file.type)) {
    throw new Error(
      "Formato não suportado. Envie apenas PDF, JPG ou PNG.",
    );
  }
}
