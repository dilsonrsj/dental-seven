import { describe, expect, it } from "vitest";
import {
  BETA_SEED_COUNTS,
  buildBetaSeedBlueprint,
} from "./seed-clinic-demo";

describe("buildBetaSeedBlueprint", () => {
  it("matches expected beta seed sizes", () => {
    const blueprint = buildBetaSeedBlueprint();
    expect(blueprint.patients).toHaveLength(BETA_SEED_COUNTS.patients);
    expect(blueprint.procedures).toHaveLength(BETA_SEED_COUNTS.procedures);
    expect(blueprint.supplies).toHaveLength(BETA_SEED_COUNTS.supplies);
    expect(blueprint.appointmentSlots).toHaveLength(BETA_SEED_COUNTS.appointments);
    expect(blueprint.suppliers).toHaveLength(BETA_SEED_COUNTS.suppliers);
    expect(blueprint.insuranceCarriers).toHaveLength(
      BETA_SEED_COUNTS.insuranceCarriers,
    );
  });

  it("uses known procedure indexes", () => {
    const blueprint = buildBetaSeedBlueprint();
    for (const slot of blueprint.appointmentSlots) {
      expect(slot.procedureIndex).toBeGreaterThanOrEqual(0);
      expect(slot.procedureIndex).toBeLessThan(blueprint.procedures.length);
      expect(slot.patientIndex).toBeLessThan(blueprint.patients.length);
    }
  });
});
