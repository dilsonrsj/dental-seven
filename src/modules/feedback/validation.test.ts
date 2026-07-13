import { describe, expect, it } from "vitest";
import {
  parseBetaFeedbackInput,
  type BetaFeedbackInput,
} from "./validation";

const valid: BetaFeedbackInput = {
  nps: 9,
  topModule: "agenda",
  likedMost: "Agenda no celular",
  blockedOrMissing: "Falta WhatsApp real",
  wouldUseToday: "yes",
  notes: "Ótimo trabalho",
};

describe("parseBetaFeedbackInput", () => {
  it("accepts a full valid payload", () => {
    const result = parseBetaFeedbackInput(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.nps).toBe(9);
      expect(result.data.topModule).toBe("agenda");
      expect(result.data.notes).toBe("Ótimo trabalho");
    }
  });

  it("allows empty notes", () => {
    const result = parseBetaFeedbackInput({ ...valid, notes: "  " });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects nps outside 0-10", () => {
    const result = parseBetaFeedbackInput({ ...valid, nps: 11 });
    expect(result.ok).toBe(false);
  });

  it("rejects missing likedMost", () => {
    const result = parseBetaFeedbackInput({ ...valid, likedMost: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid topModule", () => {
    const result = parseBetaFeedbackInput({
      ...valid,
      topModule: "estoque" as BetaFeedbackInput["topModule"],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects invalid wouldUseToday", () => {
    const result = parseBetaFeedbackInput({
      ...valid,
      wouldUseToday: "sempre" as BetaFeedbackInput["wouldUseToday"],
    });
    expect(result.ok).toBe(false);
  });
});
