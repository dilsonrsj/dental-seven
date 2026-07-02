import { describe, expect, it } from "vitest";
import {
  buildRevenueEntryDraft,
  buildReversalDrafts,
  buildVariableCostDrafts,
  shouldApplyAutoFinance,
  shouldApplyAutoFinanceReversal,
} from "./appointment-finance";

describe("shouldApplyAutoFinance", () => {
  it("true ao concluir com módulo ativo e sem lançamento prévio", () => {
    expect(
      shouldApplyAutoFinance({
        previousStatus: "pending",
        newStatus: "completed",
        financeModuleEnabled: true,
        alreadyApplied: false,
      }),
    ).toBe(true);
  });

  it("false quando módulo financeiro inativo", () => {
    expect(
      shouldApplyAutoFinance({
        previousStatus: "pending",
        newStatus: "completed",
        financeModuleEnabled: false,
        alreadyApplied: false,
      }),
    ).toBe(false);
  });

  it("false quando lançamento já aplicado", () => {
    expect(
      shouldApplyAutoFinance({
        previousStatus: "pending",
        newStatus: "completed",
        financeModuleEnabled: true,
        alreadyApplied: true,
      }),
    ).toBe(false);
  });

  it("false quando não transiciona para completed", () => {
    expect(
      shouldApplyAutoFinance({
        previousStatus: "pending",
        newStatus: "confirmed",
        financeModuleEnabled: true,
        alreadyApplied: false,
      }),
    ).toBe(false);
  });
});

describe("shouldApplyAutoFinanceReversal", () => {
  it("true ao sair de completed com lançamento aplicado", () => {
    expect(
      shouldApplyAutoFinanceReversal({
        previousStatus: "completed",
        newStatus: "pending",
        financeModuleEnabled: true,
        alreadyApplied: true,
      }),
    ).toBe(true);
  });

  it("false sem lançamento aplicado", () => {
    expect(
      shouldApplyAutoFinanceReversal({
        previousStatus: "completed",
        newStatus: "pending",
        financeModuleEnabled: true,
        alreadyApplied: false,
      }),
    ).toBe(false);
  });

  it("false quando módulo financeiro inativo", () => {
    expect(
      shouldApplyAutoFinanceReversal({
        previousStatus: "completed",
        newStatus: "pending",
        financeModuleEnabled: false,
        alreadyApplied: true,
      }),
    ).toBe(false);
  });
});

describe("buildRevenueEntryDraft", () => {
  it("gera receita positiva com nome do procedimento", () => {
    expect(
      buildRevenueEntryDraft({
        procedureName: "Limpeza",
        basePriceCents: 15000,
      }),
    ).toEqual({
      entry_type: "revenue",
      amount_cents: 15000,
      description: "Limpeza",
    });
  });
});

describe("buildVariableCostDrafts", () => {
  it("gera custos negativos por insumo com unit_cost", () => {
    expect(
      buildVariableCostDrafts([
        { supply_name: "Luva", quantity: 2, unit_cost_cents: 150 },
        { supply_name: "Máscara", quantity: 1, unit_cost_cents: 80 },
      ]),
    ).toEqual([
      {
        entry_type: "variable_cost",
        amount_cents: -300,
        description: "Luva",
      },
      {
        entry_type: "variable_cost",
        amount_cents: -80,
        description: "Máscara",
      },
    ]);
  });

  it("ignora itens sem unit_cost_cents", () => {
    expect(
      buildVariableCostDrafts([
        { supply_name: "Sem custo", quantity: 3, unit_cost_cents: null },
        { supply_name: "Com custo", quantity: 2, unit_cost_cents: 100 },
      ]),
    ).toEqual([
      {
        entry_type: "variable_cost",
        amount_cents: -200,
        description: "Com custo",
      },
    ]);
  });

  it("arredonda qty * unit_cost", () => {
    expect(
      buildVariableCostDrafts([
        { supply_name: "Fracionado", quantity: 1.5, unit_cost_cents: 100 },
      ]),
    ).toEqual([
      {
        entry_type: "variable_cost",
        amount_cents: -150,
        description: "Fracionado",
      },
    ]);
  });
});

describe("buildReversalDrafts", () => {
  it("espelha entradas auto com tipos e valores opostos", () => {
    expect(
      buildReversalDrafts([
        {
          entry_type: "revenue",
          amount_cents: 15000,
          description: "Limpeza",
        },
        {
          entry_type: "variable_cost",
          amount_cents: -300,
          description: "Luva",
        },
      ]),
    ).toEqual([
      {
        entry_type: "revenue_reversal",
        amount_cents: -15000,
        description: "Limpeza",
      },
      {
        entry_type: "variable_cost_reversal",
        amount_cents: 300,
        description: "Luva",
      },
    ]);
  });
});
