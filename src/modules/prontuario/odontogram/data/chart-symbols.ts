/** Símbolos esquemáticos clínicos — coroa + raízes (viewBox 0 0 28 52). */
export const CHART_SYMBOLS = {
  "tooth-upper-1": {
    viewBox: "0 0 28 52",
    d: [
      "M 8 26 L 14 4 L 20 26 Z",
      "M 7 28 H 21 V 44 Q 14 48 7 44 Z",
    ].join(" "),
  },
  "tooth-upper-2": {
    viewBox: "0 0 28 52",
    d: [
      "M 6 26 L 9 6 L 12 26 Z",
      "M 16 26 L 19 6 L 22 26 Z",
      "M 7 28 H 21 V 44 Q 14 48 7 44 Z",
    ].join(" "),
  },
  "tooth-upper-3": {
    viewBox: "0 0 28 52",
    d: [
      "M 4 26 L 7 5 L 10 26 Z",
      "M 11 26 L 14 3 L 17 26 Z",
      "M 18 26 L 21 5 L 24 26 Z",
      "M 6 28 H 22 V 44 Q 14 48 6 44 Z",
    ].join(" "),
  },
  "tooth-lower-1": {
    viewBox: "0 0 28 52",
    d: [
      "M 7 8 H 21 Q 14 4 7 8 Z",
      "M 7 10 H 21 V 24 Q 14 28 7 24 Z",
      "M 8 26 L 14 48 L 20 26 Z",
    ].join(" "),
  },
  "tooth-lower-2": {
    viewBox: "0 0 28 52",
    d: [
      "M 7 8 H 21 Q 14 4 7 8 Z",
      "M 7 10 H 21 V 24 Q 14 28 7 24 Z",
      "M 6 26 L 9 46 L 12 26 Z",
      "M 16 26 L 19 46 L 22 26 Z",
    ].join(" "),
  },
  "tooth-lower-3": {
    viewBox: "0 0 28 52",
    d: [
      "M 7 8 H 21 Q 14 4 7 8 Z",
      "M 7 10 H 21 V 24 Q 14 28 7 24 Z",
      "M 4 26 L 7 47 L 10 26 Z",
      "M 11 26 L 14 49 L 17 26 Z",
      "M 18 26 L 21 47 L 24 26 Z",
    ].join(" "),
  },
} as const;

export type ChartSymbolId = keyof typeof CHART_SYMBOLS;

export function symbolIdForTooth(isUpper: boolean, rootCount: number): ChartSymbolId {
  const roots = Math.min(Math.max(rootCount, 1), 3);
  return isUpper
    ? (`tooth-upper-${roots}` as ChartSymbolId)
    : (`tooth-lower-${roots}` as ChartSymbolId);
}

export function symbolHref(isUpper: boolean, rootCount: number): string {
  return `#${symbolIdForTooth(isUpper, rootCount)}`;
}

export function getSymbolPath(isUpper: boolean, rootCount: number): string {
  return CHART_SYMBOLS[symbolIdForTooth(isUpper, rootCount)].d;
}

export const SYMBOL_SIZE = { width: 28, height: 52 } as const;

/** Centraliza símbolo na origem do dente (linha oclusal ≈ y 0). */
export const SYMBOL_ANCHOR = { x: 14, y: 26 } as const;

export function symbolFitTransform(scale: number): string {
  return `translate(${-SYMBOL_ANCHOR.x} ${-SYMBOL_ANCHOR.y}) scale(${scale})`;
}
