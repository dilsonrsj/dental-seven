import { describe, expect, it } from "vitest";
import {
  buildReorderWhatsAppUrl,
  buildReorderMessage,
  normalizePhoneForWhatsApp,
} from "./whatsapp-reorder";

describe("whatsapp-reorder", () => {
  it("prefixa 55 em número local", () => {
    expect(normalizePhoneForWhatsApp("11987654321")).toBe("5511987654321");
  });

  it("monta mensagem com saldo e mínimo", () => {
    const msg = buildReorderMessage({
      supplyName: "Luva",
      quantityOnHand: 3,
      unitLabel: "par",
      minQuantity: 10,
    });
    expect(msg).toContain("Luva");
    expect(msg).toContain("3");
    expect(msg).toContain("10");
  });

  it("monta URL wa.me", () => {
    const url = buildReorderWhatsAppUrl({
      phone: "11987654321",
      supplyName: "Luva",
      quantityOnHand: 3,
      unitLabel: "par",
      minQuantity: 10,
    });
    expect(url).toMatch(/^https:\/\/wa\.me\/5511987654321\?text=/);
  });
});
