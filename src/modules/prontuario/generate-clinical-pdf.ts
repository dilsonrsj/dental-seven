import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { atestadoTemplate, buildAtestadoLines } from "./templates/atestado";
import { buildGuiaLines, guiaTemplate } from "./templates/guia";
import { buildReceitaLines, receitaTemplate } from "./templates/receita";
import type {
  ClinicalDocumentTemplate,
  ClinicalPdfPayload,
  ClinicalTemplateDefinition,
} from "./templates/types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 50;
const LINE_HEIGHT = 16;
const FOOTER_Y = 120;

const TEMPLATE_MAP: Record<
  ClinicalDocumentTemplate,
  ClinicalTemplateDefinition
> = {
  receita: receitaTemplate,
  atestado: atestadoTemplate,
  guia: guiaTemplate,
};

function formatIssuedAt(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function dentistFooterLines(payload: ClinicalPdfPayload): string[] {
  const lines = [payload.dentistName];
  if (payload.dentistCro?.trim()) lines.push(`CRO: ${payload.dentistCro.trim()}`);
  if (payload.dentistSpecialty?.trim()) {
    lines.push(payload.dentistSpecialty.trim());
  }
  return lines;
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

  let cursorY = PAGE_HEIGHT - 70;

  page.drawText(payload.clinicName, {
    x: MARGIN_X,
    y: cursorY,
    size: 14,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= 24;

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
    if (cursorY < FOOTER_Y + 40) break;
    page.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: 12,
      font: regular,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= LINE_HEIGHT;
  }

  let footerY = FOOTER_Y;
  for (const line of dentistFooterLines(payload)) {
    page.drawText(line, {
      x: MARGIN_X,
      y: footerY,
      size: 11,
      font: regular,
      color: rgb(0.15, 0.15, 0.15),
    });
    footerY -= 14;
  }

  if (payload.signatureImageBytes?.length) {
    try {
      const signature = await pdfDoc.embedPng(payload.signatureImageBytes);
      const maxWidth = 160;
      const scale = Math.min(1, maxWidth / signature.width);
      const width = signature.width * scale;
      const height = signature.height * scale;

      page.drawImage(signature, {
        x: PAGE_WIDTH - MARGIN_X - width,
        y: FOOTER_Y - height + 20,
        width,
        height,
      });
    } catch {
      // Assinatura inválida não bloqueia o PDF.
    }
  }

  return pdfDoc.save();
}

export { TEMPLATE_MAP };
