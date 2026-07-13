import { describe, expect, it } from "vitest";
import {
  ANAMNESIS_FIELDS,
  ANAMNESIS_TEMPLATE_VERSION,
  emptyAnamnesisResponses,
  fieldsForSection,
  normalizeAnamnesisResponses,
} from "./template-v1";

describe("anamnesis template", () => {
  it("has 13 fields", () => {
    expect(ANAMNESIS_FIELDS).toHaveLength(13);
  });

  it("declares template version v1", () => {
    expect(ANAMNESIS_TEMPLATE_VERSION).toBe("v1");
  });

  it("uses unique keys", () => {
    const keys = ANAMNESIS_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("groups fields into three sections", () => {
    expect(fieldsForSection("geral").length).toBeGreaterThan(0);
    expect(fieldsForSection("condicoes").length).toBeGreaterThan(0);
    expect(fieldsForSection("historico").length).toBeGreaterThan(0);
  });
});

describe("emptyAnamnesisResponses", () => {
  it("defaults booleans to false and text to empty string", () => {
    const responses = emptyAnamnesisResponses();
    expect(responses.pregnant).toBe(false);
    expect(responses.allergies).toBe("");
  });
});

describe("normalizeAnamnesisResponses", () => {
  it("coerces boolean-like values", () => {
    const responses = normalizeAnamnesisResponses({
      pregnant: "true",
      diabetes: true,
      smoker: "no",
    });
    expect(responses.pregnant).toBe(true);
    expect(responses.diabetes).toBe(true);
    expect(responses.smoker).toBe(false);
  });

  it("trims text values and drops unknown keys", () => {
    const responses = normalizeAnamnesisResponses({
      allergies: "  Penicilina  ",
      unknown_field: "ignored",
    });
    expect(responses.allergies).toBe("Penicilina");
    expect("unknown_field" in responses).toBe(false);
  });

  it("handles non-object input", () => {
    expect(() => normalizeAnamnesisResponses(null)).not.toThrow();
    expect(normalizeAnamnesisResponses(null).medications).toBe("");
  });
});
