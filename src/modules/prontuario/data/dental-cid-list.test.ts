import { describe, expect, it } from "vitest";
import {
  DENTAL_CID_LIST,
  formatDentalCidOption,
  getDentalCidByCode,
} from "./dental-cid-list";

describe("dental-cid-list", () => {
  it("retorna entrada por código", () => {
    const entry = getDentalCidByCode("K04.0");
    expect(entry).toEqual({
      code: "K04.0",
      label: "Pulpite",
      category: "Cárie e polpa",
    });
  });

  it("retorna undefined para código inexistente", () => {
    expect(getDentalCidByCode("Z99.9")).toBeUndefined();
  });

  it("formata opção para o select", () => {
    expect(
      formatDentalCidOption({ code: "K04.0", label: "Pulpite", category: "x" }),
    ).toBe("K04.0 — Pulpite");
  });

  it("tem códigos únicos", () => {
    const codes = DENTAL_CID_LIST.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
