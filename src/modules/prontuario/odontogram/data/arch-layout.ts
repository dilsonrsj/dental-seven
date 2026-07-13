import {
  LOWER_ARCH_LEFT,
  LOWER_ARCH_RIGHT,
  UPPER_ARCH_LEFT,
  UPPER_ARCH_RIGHT,
} from "./fdi";
import type { ToothGroup } from "./dental-data";

export type ToothLayout = {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  isUpper: boolean;
  group: ToothGroup;
};

/** ViewBox apertado: menos “letterbox” vertical, dentes maiores no mobile. */
export const DENTAL_CHART_VIEWBOX = "0 0 860 300";

const CENTER_X = 430;
const UPPER_BASE_Y = 98;
const LOWER_BASE_Y = 210;
const TOOTH_SPACING = 46;
const ARCH_DROP = 14;
const ARCH_ROTATION = 2;
const SIZE_BOOST = 1.36;

function scaleForGroup(group: ToothGroup): number {
  const base = (() => {
    switch (group) {
      case "incisor":
        return 0.88;
      case "canine":
        return 0.96;
      case "premolar":
        return 1.02;
      case "first_molar":
        return 1.1;
      case "second_molar":
        return 1.06;
      case "third_molar":
        return 0.98;
    }
  })();

  return base * SIZE_BOOST;
}

function layoutOnArch(
  index: number,
  count: number,
  baseY: number,
  isUpper: boolean,
): Pick<ToothLayout, "x" | "y" | "rotation"> {
  const centered = index - (count - 1) / 2;
  const x = CENTER_X + centered * TOOTH_SPACING;
  const midDrop = (7.5 - Math.abs(centered)) * (ARCH_DROP / 7.5);
  const y = isUpper ? baseY + midDrop : baseY - midDrop;
  const rotation = centered * ARCH_ROTATION;
  return { x, y, rotation };
}

function buildArch(
  teeth: readonly number[],
  isUpper: boolean,
  groups: Map<number, ToothGroup>,
): ToothLayout[] {
  return teeth.map((id, index) => {
    const { x, y, rotation } = layoutOnArch(index, teeth.length, isUpper ? UPPER_BASE_Y : LOWER_BASE_Y, isUpper);
    const group = groups.get(id) ?? "incisor";
    return {
      id,
      x,
      y,
      rotation,
      isUpper,
      group,
      scale: scaleForGroup(group),
    };
  });
}

export function buildToothLayouts(
  groups: Map<number, ToothGroup>,
): ToothLayout[] {
  return [
    ...buildArch([...UPPER_ARCH_LEFT, ...UPPER_ARCH_RIGHT], true, groups),
    ...buildArch([...LOWER_ARCH_LEFT, ...LOWER_ARCH_RIGHT], false, groups),
  ];
}

export function toothTransform(layout: ToothLayout): string {
  return `translate(${layout.x} ${layout.y}) rotate(${layout.rotation}) scale(${layout.scale})`;
}

/** Distância do anchor até a borda da coroa (unidades do símbolo, antes do scale). */
const UPPER_CROWN_BOTTOM = 22;
const LOWER_CROWN_TOP = 22;
const LABEL_CLEARANCE = 14;

export function labelPosition(layout: ToothLayout): { x: number; y: number } {
  if (layout.isUpper) {
    return {
      x: layout.x,
      y: layout.y + UPPER_CROWN_BOTTOM * layout.scale + LABEL_CLEARANCE,
    };
  }

  return {
    x: layout.x,
    y: layout.y - LOWER_CROWN_TOP * layout.scale - LABEL_CLEARANCE,
  };
}
