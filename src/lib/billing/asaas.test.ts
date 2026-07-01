import { afterEach, describe, expect, it } from "vitest";
import { isAsaasConfigured } from "./asaas";

describe("isAsaasConfigured", () => {
  afterEach(() => {
    delete process.env.ASAAS_API_KEY;
  });

  it("returns false without API key", () => {
    expect(isAsaasConfigured()).toBe(false);
  });

  it("returns true with API key", () => {
    process.env.ASAAS_API_KEY = "test-key";
    expect(isAsaasConfigured()).toBe(true);
  });
});
