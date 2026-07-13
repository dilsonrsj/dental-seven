import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { isPngImage } from "@/lib/clinic/clinic-logo";
import { buildAtestadoLines } from "./templates/atestado";
import { buildGuiaLines } from "./templates/guia";
import { buildReceitaLines } from "./templates/receita";
import { TEMPLATE_MAP } from "./templates/registry";
import type { ClinicalPdfPayload } from "./templates/types";
import {
  FOOTER_MIN_BODY_Y,
  MARGIN_X,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  drawClinicalPdfFooter,
  embedFooterAssets,
} from "./pdf/clinical-pdf-footer";

const LINE_HEIGHT = 16;

function formatIssuedAt(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function bodyLinesForPayload(payload: ClinicalPdfPayload): string[] {
  switch (payload.template) {
    case "receita":
      return buildReceitaLines(payload);
    case "atestado":
      return buildAtestadoLines(payload);
    case "guia":
      return buildGuiaLines(payload);
    default: {
      const exhaustive: never = payload;
      return exhaustive;
    }
  }
}

function wrapText(text: string, maxChars = 88): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
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
  }

  return lines;
}

export async function buildClinicalPdf(
  payload: ClinicalPdfPayload,
): Promise<Uint8Array> {
  const template = TEMPLATE_MAP[payload.template];
  const pdfDoc = await PDFDocument.create();

  pdfDoc.setTitle(template.documentTitle);
  pdfDoc.setAuthor(payload.dentistName);
  pdfDoc.setSubject(template.pdfSubject);
  pdfDoc.setCreator("Dental Seven");
  pdfDoc.setProducer("Dental Seven v3.5");
  pdfDoc.setKeywords([
    payload.template,
    payload.clinicName,
    payload.patientName,
  ]);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const footerAssets = await embedFooterAssets(pdfDoc);

  let cursorY = PAGE_HEIGHT - 70;

  if (payload.clinicLogoImageBytes && payload.clinicLogoImageBytes.length > 0) {
    const logoImage = isPngImage(payload.clinicLogoImageBytes)
      ? await pdfDoc.embedPng(payload.clinicLogoImageBytes)
      : await pdfDoc.embedJpg(payload.clinicLogoImageBytes);
    const maxWidth = 120;
    const maxHeight = 48;
    const scale = Math.min(
      maxWidth / logoImage.width,
      maxHeight / logoImage.height,
      1,
    );
    const logoWidth = logoImage.width * scale;
    const logoHeight = logoImage.height * scale;
    page.drawImage(logoImage, {
      x: MARGIN_X,
      y: cursorY - logoHeight + 12,
      width: logoWidth,
      height: logoHeight,
    });
    cursorY -= logoHeight + 16;
  } else {
    page.drawText(payload.clinicName, {
      x: MARGIN_X,
      y: cursorY,
      size: 14,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= 24;
  }

  page.drawText(template.documentTitle, {
    x: MARGIN_X,
    y: cursorY,
    size: 18,
    font: bold,
    color: rgb(0.05, 0.2, 0.45),
  });
  cursorY -= 22;

  page.drawText(`Emitido em ${formatIssuedAt(payload.issuedAt)}`, {
    x: MARGIN_X,
    y: cursorY,
    size: 10,
    font: regular,
    color: rgb(0.35, 0.35, 0.35),
  });
  cursorY -= 28;

  for (const line of wrapText(bodyLinesForPayload(payload).join("\n"))) {
    if (cursorY < FOOTER_MIN_BODY_Y) break;
    page.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: 12,
      font: regular,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= LINE_HEIGHT;
  }

  await drawClinicalPdfFooter(
    page,
    pdfDoc,
    {
      dentistName: payload.dentistName,
      dentistCro: payload.dentistCro,
      dentistSpecialty: payload.dentistSpecialty,
      clinicContact: payload.clinicContact,
      signatureImageBytes: payload.signatureImageBytes,
    },
    regular,
    footerAssets,
  );

  return pdfDoc.save();
}