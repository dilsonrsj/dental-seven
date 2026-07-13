import { describe, expect, it } from "vitest";
import { buildFooterRows } from "./clinical-pdf-footer";

describe("buildFooterRows", () => {
  it("empilha contatos de baixo para cima ancorados na margem inferior", () => {
    const rows = buildFooterRows({
      dentistName: "Dra. Smoke Test",
      dentistCro: "123456",
      dentistSpecialty: "Ortodontia",
      clinicContact: {
        whatsapp: "(11) 98765-4321",
        instagram: "@clinica.smoketest",
        email: "contato@test.com",
        address: "Av. Paulista, 1000",
      },
    });

    expect(rows).toHaveLength(4);
    expect(rows[0]?.left?.type).toBe("address");
    expect(rows[3]?.left?.type).toBe("whatsapp");
    expect(rows[3]?.center).toBe("Dra. Smoke Test");
    expect(rows[2]?.center).toBe("CRO: 123456");
    expect(rows[1]?.center).toBe("Ortodontia");
  });

  it("reserva altura extra quando endereço quebra em várias linhas", () => {
    const rows = buildFooterRows({
      dentistName: "Dra. Smoke Test",
      dentistCro: "123456",
      dentistSpecialty: "Ortodontia",
      clinicContact: {
        whatsapp: "(11) 98765-4321",
        instagram: "@clinica",
        email: "contato@test.com",
        address: "Av. Paulista, 1000 — Sala 42 — São Paulo/SP — CEP 01310-100",
      },
    });

    const emailRow = rows.find((row) => row.left?.type === "email");
    expect(emailRow?.y).toBeGreaterThan(59);
  });

  it("omite linhas de contato vazias", () => {
    const rows = buildFooterRows({
      dentistName: "Dr. João",
      dentistCro: null,
      dentistSpecialty: null,
      clinicContact: { whatsapp: "(11) 99999-0000" },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.left?.text).toBe("(11) 99999-0000");
    expect(rows[0]?.center).toBe("Dr. João");
  });
});
