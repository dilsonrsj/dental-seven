"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { dentalData, type DentalToothData } from "../data/dental-data";
import {
  buildToothLayouts,
  DENTAL_CHART_VIEWBOX,
  labelPosition,
  toothTransform,
} from "../data/arch-layout";
import { getSymbolPath, symbolFitTransform } from "../data/chart-symbols";
import {
  getToothStatusColor,
  toothHasClinicalStatus,
  type ToothStatus,
} from "../data/tooth-status";
import styles from "./dental-chart.module.css";

export type DentalChartProps = {
  data?: DentalToothData[];
  recordsByTooth?: Map<number, ToothStatus>;
  teethWithHistory?: Set<number>;
  selectedTooth: number | null;
  onToothSelect: (toothId: number) => void;
};

export function DentalChart({
  data = dentalData,
  recordsByTooth,
  teethWithHistory,
  selectedTooth,
  onToothSelect,
}: DentalChartProps) {
  const groupMap = useMemo(
    () => new Map(data.map((tooth) => [tooth.id, tooth.group])),
    [data],
  );

  const layouts = useMemo(() => buildToothLayouts(groupMap), [groupMap]);

  const dataById = useMemo(
    () => new Map(data.map((tooth) => [tooth.id, tooth])),
    [data],
  );

  return (
    <div className={styles.chartShell}>
      <svg
        id="dental-chart"
        viewBox={DENTAL_CHART_VIEWBOX}
        xmlns="http://www.w3.org/2000/svg"
        className={styles.chartSvg}
        role="img"
        aria-label="Odontograma interativo — 32 dentes FDI"
      >
        <rect
          className={styles.chartBackground}
          width="100%"
          height="100%"
          rx="12"
        />

        {layouts.map((layout) => {
          const tooth = dataById.get(layout.id);
          if (!tooth) return null;

          const status = recordsByTooth?.get(layout.id) ?? "healthy";
          const selected = selectedTooth === layout.id;
          const hasHistory = teethWithHistory?.has(layout.id) ?? false;
          const hasStatus = toothHasClinicalStatus(status);
          const statusColor = hasStatus
            ? getToothStatusColor(status, false)
            : undefined;
          const label = labelPosition(layout);

          const groupClass = [
            styles.toothGroup,
            selected ? styles.selected : "",
            hasStatus ? styles.hasStatus : "",
            hasHistory && !selected ? styles.hasHistory : "",
          ]
            .filter(Boolean)
            .join(" ");

          const labelClass = [
            styles.toothLabel,
            selected ? styles.toothLabelSelected : "",
            hasHistory && !selected ? styles.toothLabelHistory : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <g key={layout.id}>
              <g
                id={`tooth-${layout.id}`}
                className={groupClass}
                transform={toothTransform(layout)}
                style={
                  hasStatus && !selected
                    ? ({ "--tooth-status": statusColor } as CSSProperties)
                    : undefined
                }
                onClick={() => onToothSelect(layout.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onToothSelect(layout.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${tooth.name} (FDI ${layout.id})`}
                aria-pressed={selected}
              >
                <g transform={symbolFitTransform(1)}>
                  <rect
                    className={styles.hitArea}
                    x={-18}
                    y={-34}
                    width={36}
                    height={68}
                  />
                  <path
                    d={getSymbolPath(layout.isUpper, tooth.roots)}
                    className={styles.toothShape}
                  />
                </g>
              </g>
              <text
                x={label.x}
                y={label.y}
                className={labelClass}
                textAnchor="middle"
                pointerEvents="none"
              >
                {layout.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
