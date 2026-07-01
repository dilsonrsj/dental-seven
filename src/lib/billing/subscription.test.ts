import { describe, expect, it } from "vitest";
import {
  isSubscriptionBlocking,
  shouldShowPaywall,
} from "./subscription";

describe("shouldShowPaywall", () => {
  it("shows for expired clinic_admin", () => {
    expect(shouldShowPaywall("expired", "clinic_admin")).toBe(true);
  });

  it("hides for super_admin", () => {
    expect(shouldShowPaywall("expired", "super_admin")).toBe(false);
  });

  it("hides for trialing", () => {
    expect(shouldShowPaywall("trialing", "clinic_admin")).toBe(false);
  });
});

describe("isSubscriptionBlocking", () => {
  it("blocks expired non-admin", () => {
    expect(isSubscriptionBlocking("expired", "dentist")).toBe(true);
  });

  it("allows active", () => {
    expect(isSubscriptionBlocking("active", "clinic_admin")).toBe(false);
  });
});
