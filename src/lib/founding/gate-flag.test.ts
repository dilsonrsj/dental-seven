import { describe, expect, it } from "vitest";
import { parseEnvFlag } from "./parse-env-flag";

describe("parseEnvFlag", () => {
  it("accepts true / 1 / yes", () => {
    expect(parseEnvFlag("true")).toBe(true);
    expect(parseEnvFlag("TRUE")).toBe(true);
    expect(parseEnvFlag("1")).toBe(true);
    expect(parseEnvFlag("yes")).toBe(true);
  });

  it("strips surrounding quotes from misconfigured env", () => {
    expect(parseEnvFlag('"true"')).toBe(true);
    expect(parseEnvFlag("''true''")).toBe(true);
  });

  it("rejects empty, false, and bare quotes", () => {
    expect(parseEnvFlag(undefined)).toBe(false);
    expect(parseEnvFlag("")).toBe(false);
    expect(parseEnvFlag('""')).toBe(false);
    expect(parseEnvFlag("false")).toBe(false);
  });
});
