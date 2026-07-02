import { describe, expect, it } from "vitest";
import {
  buildDeductionMovements,
  buildReversalMovements,
  shouldApplyAutoDeduction,
  shouldApplyAutoReversal,
} from "./appointment-stock";

describe("shouldApplyAutoDeduction", () => {
  it("true ao concluir com procedure_id e BOM", () => {
    expect(
      shouldApplyAutoDeduction({
        previousStatus: "pending",
        newStatus: "completed",
        procedureId: "proc-1",
        bomItems: [{ supply_id: "s1", quantity: 2 }],
        alreadyApplied: false,
        estoqueModuleEnabled: true,
      }),
    ).toBe(true);
  });

  it("false sem procedure_id", () => {
    expect(
      shouldApplyAutoDeduction({
        previousStatus: "pending",
        newStatus: "completed",
        procedureId: null,
        bomItems: [{ supply_id: "s1", quantity: 2 }],
        alreadyApplied: false,
        estoqueModuleEnabled: true,
      }),
    ).toBe(false);
  });

  it("false quando módulo estoque inativo", () => {
    expect(
      shouldApplyAutoDeduction({
        previousStatus: "pending",
        newStatus: "completed",
        procedureId: "proc-1",
        bomItems: [{ supply_id: "s1", quantity: 2 }],
        alreadyApplied: false,
        estoqueModuleEnabled: false,
      }),
    ).toBe(false);
  });

  it("false quando baixa já aplicada", () => {
    expect(
      shouldApplyAutoDeduction({
        previousStatus: "pending",
        newStatus: "completed",
        procedureId: "proc-1",
        bomItems: [{ supply_id: "s1", quantity: 2 }],
        alreadyApplied: true,
        estoqueModuleEnabled: true,
      }),
    ).toBe(false);
  });
});

describe("shouldApplyAutoReversal", () => {
  it("true ao sair de completed com baixa aplicada", () => {
    expect(
      shouldApplyAutoReversal({
        previousStatus: "completed",
        newStatus: "pending",
        alreadyApplied: true,
        estoqueModuleEnabled: true,
      }),
    ).toBe(true);
  });

  it("false sem baixa aplicada", () => {
    expect(
      shouldApplyAutoReversal({
        previousStatus: "completed",
        newStatus: "pending",
        alreadyApplied: false,
        estoqueModuleEnabled: true,
      }),
    ).toBe(false);
  });
});

describe("buildDeductionMovements", () => {
  it("gera quantidades negativas por insumo", () => {
    expect(
      buildDeductionMovements("appt-1", [
        { supply_id: "s1", quantity: 2 },
        { supply_id: "s2", quantity: 0.5 },
      ]),
    ).toEqual([
      { supply_id: "s1", quantity: -2, movement_type: "auto_deduction" },
      { supply_id: "s2", quantity: -0.5, movement_type: "auto_deduction" },
    ]);
  });
});

describe("buildReversalMovements", () => {
  it("espelha deduções com quantidades positivas", () => {
    expect(
      buildReversalMovements("appt-1", [
        { supply_id: "s1", quantity: -2 },
        { supply_id: "s2", quantity: -0.5 },
      ]),
    ).toEqual([
      { supply_id: "s1", quantity: 2, movement_type: "auto_reversal" },
      { supply_id: "s2", quantity: 0.5, movement_type: "auto_reversal" },
    ]);
  });
});
