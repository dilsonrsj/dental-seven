import { describe, expect, it } from "vitest";
import { assertFoundingResumeAllowed } from "./founding-resume";

describe("assertFoundingResumeAllowed", () => {
  it("allows when whatsapp matches stored digits", () => {
    const result = assertFoundingResumeAllowed("(79) 99836-4822", "79998364822");
    expect(result.ok).toBe(true);
  });

  it("rejects when whatsapp does not match", () => {
    const result = assertFoundingResumeAllowed("11999999999", "79998364822");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/WhatsApp/i);
    }
  });
});
