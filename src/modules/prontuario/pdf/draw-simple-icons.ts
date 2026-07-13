import type { PDFPage } from "pdf-lib";
import { rgb } from "pdf-lib";

const ICON_COLOR = rgb(0.25, 0.25, 0.25);

/** Ícone envelope 12×12 para e-mail (vetorial). */
export function drawEmailIcon(page: PDFPage, x: number, y: number, size = 12) {
  const s = size / 12;
  page.drawRectangle({
    x: x + 1 * s,
    y: y + 3 * s,
    width: 10 * s,
    height: 7 * s,
    borderColor: ICON_COLOR,
    borderWidth: 0.8 * s,
  });
  page.drawLine({
    start: { x: x + 1 * s, y: y + 10 * s },
    end: { x: x + 6 * s, y: y + 6 * s },
    thickness: 0.8 * s,
    color: ICON_COLOR,
  });
  page.drawLine({
    start: { x: x + 11 * s, y: y + 10 * s },
    end: { x: x + 6 * s, y: y + 6 * s },
    thickness: 0.8 * s,
    color: ICON_COLOR,
  });
}

/** Ícone pin de mapa 12×12 para endereço (vetorial). */
export function drawAddressIcon(page: PDFPage, x: number, y: number, size = 12) {
  const s = size / 12;
  page.drawCircle({
    x: x + 6 * s,
    y: y + 7 * s,
    size: 3.5 * s,
    borderColor: ICON_COLOR,
    borderWidth: 0.8 * s,
  });
  page.drawLine({
    start: { x: x + 6 * s, y: y + 3.5 * s },
    end: { x: x + 6 * s, y: y + 0.5 * s },
    thickness: 0.8 * s,
    color: ICON_COLOR,
  });
}
