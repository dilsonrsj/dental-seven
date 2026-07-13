import { describe, expect, it } from "vitest";
import { resolveSignupAccessPeriod } from "./signup-access";

describe("resolveSignupAccessPeriod", () => {
  it("uses beta end date as active access when beta gate is on", () => {
    const result = resolveSignupAccessPeriod(true, "2026-08-07");
    expect(result.subscriptionStatus).toBe("active");
    expect(result.accessEndsAt).toBe("2026-08-07T23:59:59.000Z");
    expect(result.skipAsaas).toBe(true);
  });

  it("uses 7-day trial when beta gate is off", () => {
    const before = Date.now();
    const result = resolveSignupAccessPeriod(false, "2026-08-07");
    const after = Date.now();
    expect(result.subscriptionStatus).toBe("trialing");
    expect(result.skipAsaas).toBe(false);
    const ends = new Date(result.accessEndsAt).getTime();
    expect(ends).toBeGreaterThanOrEqual(before + 6 * 24 * 60 * 60 * 1000);
    expect(ends).toBeLessThanOrEqual(after + 8 * 24 * 60 * 60 * 1000);
  });
});
