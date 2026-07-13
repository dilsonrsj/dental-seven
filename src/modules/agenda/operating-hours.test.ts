import { describe, expect, it } from "vitest";
import {
  assertAppointmentWithinSchedule,
  computeWeekGridBounds,
  createDefaultClinicSchedule,
  getEffectiveDaySchedule,
  getOperatingDayOfWeek,
  validateDentistWithinClinic,
} from "./operating-hours";

describe("operating-hours", () => {
  it("mapeia segunda como 0", () => {
    expect(getOperatingDayOfWeek(new Date("2026-06-29T12:00:00.000Z"))).toBe(0);
    expect(getOperatingDayOfWeek(new Date("2026-07-05T12:00:00.000Z"))).toBe(6);
  });

  it("rejeita dentista fora do horário da clínica", () => {
    const clinic = createDefaultClinicSchedule();
    const dentist = createDefaultClinicSchedule().map((day) =>
      day.dayOfWeek === 0
        ? { ...day, opensAt: "07:00", closesAt: "18:00" }
        : day,
    );

    expect(validateDentistWithinClinic(dentist, clinic)).toMatch(/dentro do horário/i);
  });

  it("calcula interseção clínica ∩ dentista", () => {
    const clinic = createDefaultClinicSchedule()[0];
    const dentist = { ...clinic, opensAt: "09:00", closesAt: "17:00" };
    const effective = getEffectiveDaySchedule(clinic, dentist);

    expect(effective.isOpen).toBe(true);
    expect(effective.opensAt).toBe("09:00");
    expect(effective.closesAt).toBe("17:00");
  });

  it("calcula faixa horária da semana", () => {
    const schedules = createDefaultClinicSchedule();
    const weekDays = [
      new Date("2026-06-29T12:00:00.000Z"),
      new Date("2026-06-30T12:00:00.000Z"),
      new Date("2026-07-01T12:00:00.000Z"),
      new Date("2026-07-02T12:00:00.000Z"),
      new Date("2026-07-03T12:00:00.000Z"),
      new Date("2026-07-04T12:00:00.000Z"),
      new Date("2026-07-05T12:00:00.000Z"),
    ];

    const bounds = computeWeekGridBounds(weekDays, schedules);
    expect(bounds).toEqual({ startHour: 8, endHour: 18 });
  });

  it("valida consulta dentro do expediente", () => {
    const clinic = createDefaultClinicSchedule()[0];
    const dentist = clinic;

    expect(() =>
      assertAppointmentWithinSchedule(
        new Date("2026-06-29T10:00:00.000Z"),
        30,
        clinic,
        dentist,
      ),
    ).not.toThrow();

    expect(() =>
      assertAppointmentWithinSchedule(
        new Date("2026-06-29T17:45:00.000Z"),
        30,
        clinic,
        dentist,
      ),
    ).toThrow(/fora do expediente/i);
  });
});
