import { describe, expect, it } from "vitest";
import {
  assertCanAddDentist,
  getDentistQuotaSummary,
  getQuotaAfterInvite,
} from "./dentist-quota";

describe("dentist-quota", () => {
  it("bloqueia segundo dentista no Essencial", () => {
    const result = assertCanAddDentist({
      planKey: "essencial",
      activeCount: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.requiresUpgrade).toBe(true);
    }
  });

  it("exige confirmação de extra no Conecta acima de 3", () => {
    const blocked = assertCanAddDentist({
      planKey: "conecta",
      activeCount: 3,
    });
    expect(blocked.ok).toBe(false);

    const allowed = assertCanAddDentist({
      planKey: "conecta",
      activeCount: 3,
      confirmExtraCharge: true,
    });
    expect(allowed.ok).toBe(true);
    if (allowed.ok) {
      expect(allowed.extraCharge).toBe(20);
    }
  });

  it("resume quota com extras", () => {
    const summary = getDentistQuotaSummary({
      planKey: "conecta",
      activeCount: 4,
    });

    expect(summary).toEqual({
      included: 3,
      active: 4,
      extra: 1,
      extraMonthlyCost: 20,
      canAdd: true,
      requiresUpgrade: false,
      requiresExtraConfirm: true,
    });
  });

  it("calcula quota após convite", () => {
    expect(
      getQuotaAfterInvite({ planKey: "conecta", activeCountBefore: 3 }),
    ).toEqual({
      activeAfter: 4,
      extraAfter: 1,
      extraMonthlyCostAfter: 20,
    });
  });
});
