import { describe, expect, it } from "vitest";
import { resolveSignupPlanKey } from "./signup-plan";

describe("resolveSignupPlanKey", () => {
  it("forces inteligente when beta gate is on", () => {
    expect(resolveSignupPlanKey("conecta", true)).toBe("inteligente");
  });

  it("keeps requested plan when beta gate is off", () => {
    expect(resolveSignupPlanKey("conecta", false)).toBe("conecta");
  });
});
