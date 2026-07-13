import { describe, expect, it } from "vitest";
import {
  CLAIM_STATUS_LABELS,
  canTransitionClaimStatus,
  isGlosaStatus,
  isOpenReceivable,
  listSelectableClaimStatuses,
} from "./claim-status";

describe("claim status labels", () => {
  it("has PT label for glosa and paid", () => {
    expect(CLAIM_STATUS_LABELS.glosa).toBe("Glosada");
    expect(CLAIM_STATUS_LABELS.paid).toBe("Paga");
  });
});

describe("canTransitionClaimStatus", () => {
  it("allows draft to awaiting_auth", () => {
    expect(canTransitionClaimStatus("draft", "awaiting_auth")).toBe(true);
  });

  it("allows submitted to paid", () => {
    expect(canTransitionClaimStatus("submitted", "paid")).toBe(true);
  });

  it("does not allow paid to revert to draft", () => {
    expect(canTransitionClaimStatus("paid", "draft")).toBe(false);
  });

  it("allows same status (no-op)", () => {
    expect(canTransitionClaimStatus("glosa", "glosa")).toBe(true);
  });

  it("allows glosa to appealing", () => {
    expect(canTransitionClaimStatus("glosa", "appealing")).toBe(true);
  });

  it("allows draft to glosa (atalho manual v8.0)", () => {
    expect(canTransitionClaimStatus("draft", "glosa")).toBe(true);
  });
});

describe("status classifiers", () => {
  it("identifies glosa statuses", () => {
    expect(isGlosaStatus("glosa")).toBe(true);
    expect(isGlosaStatus("partial_glosa")).toBe(true);
    expect(isGlosaStatus("paid")).toBe(false);
  });

  it("identifies open receivables (paid and full glosa excluded)", () => {
    expect(isOpenReceivable("submitted")).toBe(true);
    expect(isOpenReceivable("paid")).toBe(false);
    expect(isOpenReceivable("glosa")).toBe(false);
  });
});

describe("listSelectableClaimStatuses", () => {
  it("includes current status and allowed next steps only", () => {
    expect(listSelectableClaimStatuses("draft")).toEqual([
      "draft",
      "awaiting_auth",
      "authorized",
      "submitted",
      "partial_glosa",
      "glosa",
    ]);
    expect(listSelectableClaimStatuses("paid")).toEqual(["paid"]);
  });
});
