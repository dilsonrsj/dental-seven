import { describe, expect, it } from "vitest";
import { computeAnamnesisAlerts, hasAnticoagulantKeyword } from "./alerts";
import { emptyAnamnesisResponses } from "./template-v1";

describe("computeAnamnesisAlerts", () => {
  it("returns no alert for empty responses", () => {
    const result = computeAnamnesisAlerts(emptyAnamnesisResponses());
    expect(result.has_critical_alert).toBe(false);
    expect(result.badges).toEqual([]);
  });

  it("flags allergy when text present", () => {
    const result = computeAnamnesisAlerts({ allergies: "Penicilina" });
    expect(result.has_critical_alert).toBe(true);
    expect(result.badges).toContain("Alergia informada");
  });

  it("flags pregnant, heart disease and bleeding disorder booleans", () => {
    const result = computeAnamnesisAlerts({
      pregnant: true,
      heart_disease: true,
      bleeding_disorder: true,
    });
    expect(result.badges).toContain("Gestante");
    expect(result.badges).toContain("Cardiopatia");
    expect(result.badges).toContain("Distúrbio de coagulação");
  });

  it("flags anticoagulant medication by keyword", () => {
    const result = computeAnamnesisAlerts({
      medications: "Uso contínuo de Marevan 5mg",
    });
    expect(result.badges).toContain("Uso de anticoagulante");
  });

  it("does not flag ordinary medication", () => {
    const result = computeAnamnesisAlerts({
      medications: "Paracetamol quando necessário",
    });
    expect(result.badges).not.toContain("Uso de anticoagulante");
  });
});

describe("hasAnticoagulantKeyword", () => {
  it("matches ignoring case and accents", () => {
    expect(hasAnticoagulantKeyword("VARFARINA")).toBe(true);
    expect(hasAnticoagulantKeyword("heparina")).toBe(true);
  });

  it("returns false for unrelated text", () => {
    expect(hasAnticoagulantKeyword("vitamina C")).toBe(false);
  });
});
