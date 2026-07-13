export const CLINIC_LOGO_BUCKET = "clinic-assets";
export const MAX_CLINIC_LOGO_BYTES = 2 * 1024 * 1024;

export type ClinicLogoExtension = "png" | "jpg";

export function extensionFromLogoMime(mimeType: string): ClinicLogoExtension | null {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
  return null;
}

export function buildClinicLogoPath(
  clinicId: string,
  extension: ClinicLogoExtension,
): string {
  return `${clinicId}/logo.${extension}`;
}

export function isPngImage(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}
