import { describe, expect, it } from "vitest";
import {
  buildFairUseAlertKey,
  detectFairUseEmailAlerts,
} from "./fair-use-alerts";

describe("buildFairUseAlertKey", () => {
  it("combines clinic, month, metric and threshold", () => {
    expect(buildFairUseAlertKey("c1", "2026-07", "whatsapp", "80")).toBe(
      "c1:2026-07:whatsapp:80",
    );
  });
});

describe("detectFairUseEmailAlerts", () => {
  const yearMonth = "2026-07";

  it("detects 80% whatsapp alert for completo plan", () => {
    const clinics = [
      {
        id: "c1",
        name: "Clínica A",
        plan_key: "completo" as const,
        deleted_at: null,
      },
    ];
    const usageMap = new Map([
      ["c1", { whatsapp_conversations: 2000, ai_responses: 0 }],
    ]);

    const alerts = detectFairUseEmailAlerts(
      clinics,
      usageMap,
      yearMonth,
      new Set(),
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      clinicId: "c1",
      metric: "whatsapp",
      threshold: "80",
    });
  });

  it("detects 100% threshold instead of 80 when exceeded", () => {
    const clinics = [
      {
        id: "c1",
        name: "Clínica A",
        plan_key: "completo" as const,
        deleted_at: null,
      },
    ];
    const usageMap = new Map([
      ["c1", { whatsapp_conversations: 2500, ai_responses: 0 }],
    ]);

    const alerts = detectFairUseEmailAlerts(
      clinics,
      usageMap,
      yearMonth,
      new Set(),
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0].threshold).toBe("100");
  });

  it("skips clinics with no cap (essencial)", () => {
    const clinics = [
      {
        id: "c1",
        name: "Clínica B",
        plan_key: "essencial" as const,
        deleted_at: null,
      },
    ];
    const usageMap = new Map([
      ["c1", { whatsapp_conversations: 9999, ai_responses: 9999 }],
    ]);

    expect(
      detectFairUseEmailAlerts(clinics, usageMap, yearMonth, new Set()),
    ).toHaveLength(0);
  });

  it("skips conecta plan without whatsapp cap", () => {
    const clinics = [
      {
        id: "c1",
        name: "Clínica C",
        plan_key: "conecta" as const,
        deleted_at: null,
      },
    ];
    const usageMap = new Map([
      ["c1", { whatsapp_conversations: 9999, ai_responses: 0 }],
    ]);

    expect(
      detectFairUseEmailAlerts(clinics, usageMap, yearMonth, new Set()),
    ).toHaveLength(0);
  });

  it("skips already sent alerts", () => {
    const clinics = [
      {
        id: "c1",
        name: "Clínica A",
        plan_key: "completo" as const,
        deleted_at: null,
      },
    ];
    const usageMap = new Map([
      ["c1", { whatsapp_conversations: 2000, ai_responses: 0 }],
    ]);
    const sent = new Set([buildFairUseAlertKey("c1", yearMonth, "whatsapp", "80")]);

    expect(
      detectFairUseEmailAlerts(clinics, usageMap, yearMonth, sent),
    ).toHaveLength(0);
  });
});
