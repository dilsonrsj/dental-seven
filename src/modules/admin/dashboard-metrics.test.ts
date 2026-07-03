import { describe, expect, it } from "vitest";
import {
  computeDashboardKpis,
  estimateMrr,
  trialsExpiringSoon,
} from "./dashboard-metrics";
import type { AdminClinicMetricsInput } from "./types";

function clinic(
  overrides: Partial<AdminClinicMetricsInput> & Pick<AdminClinicMetricsInput, "id">,
): AdminClinicMetricsInput {
  return {
    name: "Clínica Teste",
    slug: "clinica-teste",
    subscription_status: "active",
    plan_key: "conecta",
    trial_ends_at: null,
    deleted_at: null,
    ...overrides,
  };
}

describe("estimateMrr", () => {
  it("soma planos active e past_due", () => {
    const clinics = [
      clinic({ id: "1", subscription_status: "active", plan_key: "essencial" }),
      clinic({ id: "2", subscription_status: "past_due", plan_key: "completo" }),
      clinic({ id: "3", subscription_status: "trialing", plan_key: "completo" }),
      clinic({ id: "4", subscription_status: "expired", plan_key: "completo" }),
    ];
    expect(estimateMrr(clinics)).toBe(99 + 349);
  });

  it("ignora clínicas encerradas (deleted_at)", () => {
    const clinics = [
      clinic({
        id: "1",
        subscription_status: "active",
        plan_key: "inteligente",
        deleted_at: "2026-01-01T00:00:00.000Z",
      }),
    ];
    expect(estimateMrr(clinics)).toBe(0);
  });
});

describe("computeDashboardKpis", () => {
  it("agrega contagens por status", () => {
    const clinics = [
      clinic({ id: "1", subscription_status: "active" }),
      clinic({ id: "2", subscription_status: "active" }),
      clinic({ id: "3", subscription_status: "trialing" }),
      clinic({ id: "4", subscription_status: "past_due" }),
      clinic({ id: "5", subscription_status: "expired" }),
      clinic({ id: "6", subscription_status: "canceled" }),
      clinic({
        id: "7",
        subscription_status: "active",
        deleted_at: "2026-01-01T00:00:00.000Z",
      }),
    ];

    expect(computeDashboardKpis(clinics)).toEqual({
      activeCount: 2,
      trialingCount: 1,
      pastDueCount: 1,
      closedCount: 3,
      estimatedMrr: 149 + 149 + 149,
    });
  });
});

describe("trialsExpiringSoon", () => {
  const now = new Date("2026-07-03T12:00:00.000Z");

  it("retorna trials que expiram nos próximos N dias", () => {
    const clinics = [
      clinic({
        id: "soon",
        subscription_status: "trialing",
        trial_ends_at: "2026-07-05T00:00:00.000Z",
      }),
      clinic({
        id: "later",
        subscription_status: "trialing",
        trial_ends_at: "2026-07-20T00:00:00.000Z",
      }),
      clinic({
        id: "active",
        subscription_status: "active",
        trial_ends_at: "2026-07-05T00:00:00.000Z",
      }),
    ];

    const result = trialsExpiringSoon(clinics, 7, now);
    expect(result.map((c) => c.id)).toEqual(["soon"]);
  });

  it("ordena por trial_ends_at ascendente", () => {
    const clinics = [
      clinic({
        id: "b",
        subscription_status: "trialing",
        trial_ends_at: "2026-07-08T00:00:00.000Z",
      }),
      clinic({
        id: "a",
        subscription_status: "trialing",
        trial_ends_at: "2026-07-04T00:00:00.000Z",
      }),
    ];

    const result = trialsExpiringSoon(clinics, 7, now);
    expect(result.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("exclui trials já expirados e clínicas deletadas", () => {
    const clinics = [
      clinic({
        id: "past",
        subscription_status: "trialing",
        trial_ends_at: "2026-06-01T00:00:00.000Z",
      }),
      clinic({
        id: "deleted",
        subscription_status: "trialing",
        trial_ends_at: "2026-07-05T00:00:00.000Z",
        deleted_at: "2026-07-01T00:00:00.000Z",
      }),
    ];

    expect(trialsExpiringSoon(clinics, 7, now)).toEqual([]);
  });
});
