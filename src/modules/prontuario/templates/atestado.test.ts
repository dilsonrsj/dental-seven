import { describe, expect, it } from "vitest";
import { buildAtestadoLines } from "./atestado";

const base = {
  clinicName: "Clínica",
  patientName: "Maria",
  dentistName: "Dr. João",
  dentistCro: null,
  dentistSpecialty: null,
  issuedAt: new Date("2026-07-03"),
  template: "atestado" as const,
  daysOff: 2,
  reason: null,
  cidPatientAuthorized: false,
  cid: null,
};

describe("buildAtestadoLines", () => {
  it("mantém texto legado sem autorização de CID", () => {
    const lines = buildAtestadoLines(base);
    expect(lines.join("\n")).toContain("Atesto, para os devidos fins");
    expect(lines.join("\n")).not.toContain("CID-11");
  });

  it("usa redação CFO com CID autorizado", () => {
    const lines = buildAtestadoLines({
      ...base,
      cidPatientAuthorized: true,
      cid: { code: "K04.0", label: "Pulpite" },
    });
    const text = lines.join("\n");
    expect(text).toContain("a pedido do interessado");
    expect(text).toContain("CID-11 nº K04.0 — Pulpite");
  });

  it("inclui motivo opcional após o corpo principal", () => {
    const lines = buildAtestadoLines({ ...base, reason: "Extração" });
    expect(lines.join("\n")).toContain("Motivo: Extração");
  });
});
