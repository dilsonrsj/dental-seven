import { describe, expect, it } from "vitest";
import {
  resolveInsurancePlanSelection,
  resolvePatientInsuranceDefaults,
} from "./insurance-defaults";

describe("resolvePatientInsuranceDefaults", () => {
  const primaryPlans = {
    "patient-with-plan": "plan-a",
    "patient-inactive-plan": "plan-b",
  };
  const activePlanIds = ["plan-a", "plan-c"];

  it("selects insurance when patient has active primary plan", () => {
    expect(
      resolvePatientInsuranceDefaults(
        "patient-with-plan",
        primaryPlans,
        activePlanIds,
      ),
    ).toEqual({
      payment_source: "insurance",
      insurance_plan_id: "plan-a",
    });
  });

  it("falls back to particular when primary plan is inactive", () => {
    expect(
      resolvePatientInsuranceDefaults(
        "patient-inactive-plan",
        primaryPlans,
        activePlanIds,
      ),
    ).toEqual({
      payment_source: "particular",
      insurance_plan_id: "",
    });
  });

  it("falls back to particular when patient has no enrollment", () => {
    expect(
      resolvePatientInsuranceDefaults("patient-none", primaryPlans, activePlanIds),
    ).toEqual({
      payment_source: "particular",
      insurance_plan_id: "",
    });
  });
});

describe("resolveInsurancePlanSelection", () => {
  it("keeps current plan when still active", () => {
    expect(
      resolveInsurancePlanSelection("plan-b", ["plan-a", "plan-b"]),
    ).toBe("plan-b");
  });

  it("falls back to first active plan when current is blank", () => {
    expect(resolveInsurancePlanSelection("", ["plan-a", "plan-b"])).toBe(
      "plan-a",
    );
  });

  it("falls back to first active plan when current is inactive", () => {
    expect(resolveInsurancePlanSelection("plan-old", ["plan-a"])).toBe("plan-a");
  });
});
