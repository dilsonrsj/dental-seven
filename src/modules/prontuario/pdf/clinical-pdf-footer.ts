import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PDFDocument, PDFImage, PDFPage, PDFFont } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { ClinicContactInfo } from "../templates/types";
import { drawAddressIcon, drawEmailIcon } from "./draw-simple-icons";

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN_X = 50;
export const MARGIN_BOTTOM = 45;
export const FOOTER_LINE_HEIGHT = 14;
export const ICON_SIZE = 12;
export const TEXT_AFTER_ICON = 18;
export const SIGNATURE_MAX_WIDTH = 180;
export const SIGNATURE_GAP = 4;
/** Corpo não invade abaixo deste y (origem inferior esquerda). */
export const FOOTER_MIN_BODY_Y = 185;

type ContactIconType = "whatsapp" | "instagram" | "email" | "address";

type FooterRow = {
  y: number;
  left?: { type: ContactIconType; text: string };
  center?: string;
};

type FooterAssets = {
  whatsapp?: PDFImage;
  instagram?: PDFImage;
};

let cachedWhatsappBytes: Uint8Array | undefined;
let cachedInstagramBytes: Uint8Array | undefined;

function loadPngAsset(fileName: string): Uint8Array {
  return readFileSync(
    join(process.cwd(), "src/modules/prontuario/pdf/assets", fileName),
  );
}

function getWhatsappBytes(): Uint8Array {
  cachedWhatsappBytes ??= loadPngAsset("icon-whatsapp.png");
  return cachedWhatsappBytes;
}

function getInstagramBytes(): Uint8Array {
  cachedInstagramBytes ??= loadPngAsset("icon-instagram-transparent.png");
  return cachedInstagramBytes;
}

async function embedIconBytes(
  pdfDoc: PDFDocument,
  bytes: Uint8Array,
): Promise<PDFImage | undefined> {
  const isPng =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;

  if (isPng) return pdfDoc.embedPng(bytes);
  if (isJpeg) return pdfDoc.embedJpg(bytes);
  return undefined;
}

export async function embedFooterAssets(
  pdfDoc: PDFDocument,
): Promise<FooterAssets> {
  const assets: FooterAssets = {};
  try {
    assets.whatsapp = await embedIconBytes(pdfDoc, getWhatsappBytes());
  } catch {
    // ícone opcional
  }
  try {
    assets.instagram = await embedIconBytes(pdfDoc, getInstagramBytes());
  } catch {
    // ícone opcional
  }
  return assets;
}

function wrapContactText(text: string, maxChars = 42): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

export function buildFooterRows(
  payload: {
    dentistName: string;
    dentistCro?: string | null;
    dentistSpecialty?: string | null;
    clinicContact?: ClinicContactInfo | null;
  },
): FooterRow[] {
  const contact = payload.clinicContact;
  const rows: FooterRow[] = [];
  let y = MARGIN_BOTTOM;

  const address = contact?.address?.trim();
  if (address) {
    const addressLineCount = wrapContactText(address).length;
    rows.push({ y: MARGIN_BOTTOM, left: { type: "address", text: address } });
    y = MARGIN_BOTTOM + addressLineCount * FOOTER_LINE_HEIGHT;
  }

  const email = contact?.email?.trim();
  const specialty = payload.dentistSpecialty?.trim();
  if (email || specialty) {
    rows.push({
      y,
      left: email ? { type: "email", text: email } : undefined,
      center: specialty,
    });
    y += FOOTER_LINE_HEIGHT;
  }

  const instagram = contact?.instagram?.trim();
  const croLine = payload.dentistCro?.trim()
    ? `CRO: ${payload.dentistCro.trim()}`
    : undefined;
  if (instagram || croLine) {
    rows.push({
      y,
      left: instagram ? { type: "instagram", text: instagram } : undefined,
      center: croLine,
    });
    y += FOOTER_LINE_HEIGHT;
  }

  const whatsapp = contact?.whatsapp?.trim();
  rows.push({
    y,
    left: whatsapp ? { type: "whatsapp", text: whatsapp } : undefined,
    center: payload.dentistName,
  });

  return rows;
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y,
    size,
    font,
    color: rgb(0.15, 0.15, 0.15),
  });
}

function drawContactIcon(
  page: PDFPage,
  type: ContactIconType,
  x: number,
  y: number,
  assets: FooterAssets,
) {
  const iconY = y - 2;
  switch (type) {
    case "whatsapp":
      if (assets.whatsapp) {
        page.drawImage(assets.whatsapp, {
          x,
          y: iconY,
          width: ICON_SIZE,
          height: ICON_SIZE,
        });
      }
      break;
    case "instagram":
      if (assets.instagram) {
        page.drawImage(assets.instagram, {
          x,
          y: iconY,
          width: ICON_SIZE,
          height: ICON_SIZE,
        });
      }
      break;
    case "email":
      drawEmailIcon(page, x, iconY, ICON_SIZE);
      break;
    case "address":
      drawAddressIcon(page, x, iconY, ICON_SIZE);
      break;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

export async function drawClinicalPdfFooter(
  page: PDFPage,
  pdfDoc: PDFDocument,
  payload: {
    dentistName: string;
    dentistCro?: string | null;
    dentistSpecialty?: string | null;
    clinicContact?: ClinicContactInfo | null;
    signatureImageBytes?: Uint8Array | null;
  },
  font: PDFFont,
  assets: FooterAssets,
) {
  const rows = buildFooterRows(payload);
  const nameRow = rows[rows.length - 1];
  const nameRowY = nameRow.y;

  if (payload.signatureImageBytes?.length) {
    try {
      const signature = await pdfDoc.embedPng(payload.signatureImageBytes);
      const scale = Math.min(1, SIGNATURE_MAX_WIDTH / signature.width);
      const width = signature.width * scale;
      const height = signature.height * scale;
      const sigY = nameRowY + SIGNATURE_GAP;

      page.drawImage(signature, {
        x: (PAGE_WIDTH - width) / 2,
        y: sigY,
        width,
        height,
      });
    } catch {
      // assinatura inválida não bloqueia o PDF
    }
  }

  for (const row of rows) {
    if (row.left) {
      const isAddress = row.left.type === "address";
      const textLines = isAddress
        ? wrapContactText(row.left.text, 38)
        : [row.left.text];

      for (let i = 0; i < textLines.length; i++) {
        const lineY = isAddress
          ? row.y + (textLines.length - 1 - i) * FOOTER_LINE_HEIGHT
          : row.y;

        if (i === 0) {
          drawContactIcon(page, row.left.type, MARGIN_X, lineY, assets);
        }
        page.drawText(textLines[i]!, {
          x: MARGIN_X + TEXT_AFTER_ICON,
          y: lineY,
          size: 9,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
    }

    if (row.center) {
      drawCenteredText(page, row.center, row.y, font, 11);
    }
  }
}
