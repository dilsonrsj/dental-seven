import { describe, expect, it } from "vitest";
import { isValidDemoSession, verifyDemoPassword } from "./demo-session";

describe("verifyDemoPassword", () => {
  it("returns true when password matches env", () => {
    process.env.DEMO_PASSWORD = "secret123";
    expect(verifyDemoPassword("secret123")).toBe(true);
  });

  it("returns false when password differs", () => {
    process.env.DEMO_PASSWORD = "secret123";
    expect(verifyDemoPassword("wrong")).toBe(false);
  });
});

describe("isValidDemoSession", () => {
  it("accepts signed token matching secret", () => {
    process.env.DEMO_PASSWORD = "secret123";
    const token = "demo_authenticated";
    expect(isValidDemoSession(token)).toBe(true);
  });

  it("rejects null or empty", () => {
    expect(isValidDemoSession(null)).toBe(false);
    expect(isValidDemoSession("")).toBe(false);
  });
});
