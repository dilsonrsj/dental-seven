import { describe, expect, it } from "vitest";
import {
  formatIsoDateAsBr,
  maskBrDateInput,
  parseBrDateToIso,
} from "./br-date";

describe("br-date", () => {
  it("formata ISO para dd/mm/aaaa", () => {
    expect(formatIsoDateAsBr("2026-07-03")).toBe("03/07/2026");
  });

  it("converte dd/mm/aaaa para ISO", () => {
    expect(parseBrDateToIso("03/07/2026")).toBe("2026-07-03");
  });

  it("rejeita data inválida", () => {
    expect(() => parseBrDateToIso("31/02/2026")).toThrow(/inválida/);
  });

  it("aplica máscara enquanto digita", () => {
    expect(maskBrDateInput("03072026")).toBe("03/07/2026");
  });
});
