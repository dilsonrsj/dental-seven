import { describe, expect, it } from "vitest";
import { buildRefSlugBase, withRefSlugSuffix } from "@/lib/founding/ref-slug";
import { getFoundingStage } from "./founding-pipeline";
import {
  buildActionQueue,
  isClinicWithoutAdoption,
  isFounderPendingSignup,
  summarizeFounding,
} from "./operations-dashboard";
import type { AdminClinicMetricsInput } from "./types";

function clinic(
  overrides: Partial<AdminClinicMetricsInput> &
    Pick<AdminClinicMetricsInput, "id">,
): AdminClinicMetricsInput {
  return {
    name: "Clínica Teste",
    slug: "clinica-teste",
    subscription_status: "active",
    plan_key: "conecta",
    trial_ends_at: null,
    deleted_at: null,
    created_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildRefSlugBase", () => {
  it("normaliza nome, cidade e UF", () => {
    expect(buildRefSlugBase("Dra. Marina", "Aracaju", "SE")).toBe(
      "dra-marina-aracaju-se",
    );
  });
});

describe("withRefSlugSuffix", () => {
  it("adiciona sufixo numérico", () => {
    expect(withRefSlugSuffix("dra-marina-aracaju-se", 2)).toBe(
      "dra-marina-aracaju-se-2",
    );
  });
});

describe("getFoundingStage", () => {
  it("retorna active quando há pacientes", () => {
    expect(
      getFoundingStage({
        accessed_at: "2026-07-01",
        signup_completed_at: "2026-07-02",
        clinic_id: "c1",
        patient_count: 1,
        appointment_count: 0,
      }),
    ).toBe("active");
  });

  it("retorna submitted sem acesso", () => {
    expect(
      getFoundingStage({
        accessed_at: null,
        signup_completed_at: null,
        clinic_id: null,
        patient_count: 0,
        appointment_count: 0,
      }),
    ).toBe("submitted");
  });
});

describe("isClinicWithoutAdoption", () => {
  const now = new Date("2026-07-11T12:00:00.000Z");

  it("marca clínica antiga sem pacientes", () => {
    expect(
      isClinicWithoutAdoption(
        {
          ...clinic({ id: "1" }),
          patient_count: 0,
          appointment_count: 0,
        },
        now,
      ),
    ).toBe(true);
  });

  it("ignora clínica nova", () => {
    expect(
      isClinicWithoutAdoption(
        {
          ...clinic({
            id: "2",
            created_at: "2026-07-10T00:00:00.000Z",
          }),
          patient_count: 0,
          appointment_count: 0,
        },
        now,
      ),
    ).toBe(false);
  });
});

describe("isFounderPendingSignup", () => {
  const now = new Date("2026-07-11T12:00:00.000Z");

  it("marca founder antigo sem cadastro", () => {
    expect(
      isFounderPendingSignup(
        {
          id: "f1",
          full_name: "Dra. Ana",
          clinic_name: "Clínica Ana",
          created_at: "2026-07-05T00:00:00.000Z",
          signup_completed_at: null,
        },
        now,
      ),
    ).toBe(true);
  });
});

describe("buildActionQueue", () => {
  const now = new Date("2026-07-11T12:00:00.000Z");

  it("inclui past due, trial e adoção", () => {
    const items = buildActionQueue({
      clinics: [
        clinic({
          id: "past",
          subscription_status: "past_due",
        }),
        clinic({
          id: "trial",
          subscription_status: "trialing",
          trial_ends_at: "2026-07-13T00:00:00.000Z",
        }),
      ],
      adoptionClinics: [
        {
          ...clinic({ id: "inactive" }),
          patient_count: 0,
          appointment_count: 0,
        },
      ],
      founders: [],
      fairUseAlerts: [],
      now,
    });

    expect(items.map((item) => item.kind)).toEqual([
      "past_due",
      "clinic_no_adoption",
      "trial_expiring",
    ]);
  });
});

describe("summarizeFounding", () => {
  const now = new Date("2026-07-11T12:00:00.000Z");

  it("calcula conversão e top refs", () => {
    const summary = summarizeFounding(
      [
        {
          created_at: "2026-07-10T00:00:00.000Z",
          invite_ref: "dra-ana",
          signup_completed_at: "2026-07-10T01:00:00.000Z",
          clinic_id: "c1",
        },
        {
          created_at: "2026-06-01T00:00:00.000Z",
          invite_ref: "dra-ana",
          signup_completed_at: null,
          clinic_id: null,
        },
      ],
      now,
    );

    expect(summary.newFoundersLast7Days).toBe(1);
    expect(summary.convertedCount).toBe(1);
    expect(summary.conversionRate).toBe(50);
    expect(summary.topInviteRefs[0]).toEqual({ ref: "dra-ana", count: 2 });
  });
});
