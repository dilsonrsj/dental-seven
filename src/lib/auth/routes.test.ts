import { describe, expect, it } from "vitest";
import { defaultAppPathForRole, isClinicAppPath } from "./routes";

describe("isClinicAppPath", () => {
  it("matches clinic app routes", () => {
    expect(isClinicAppPath("/agenda")).toBe(true);
    expect(isClinicAppPath("/pacientes/abc/prontuario")).toBe(true);
    expect(isClinicAppPath("/procedimentos")).toBe(true);
    expect(isClinicAppPath("/estoque")).toBe(true);
    expect(isClinicAppPath("/configuracoes")).toBe(true);
  });

  it("ignores admin and public routes", () => {
    expect(isClinicAppPath("/admin")).toBe(false);
    expect(isClinicAppPath("/entrar")).toBe(false);
    expect(isClinicAppPath("/visao")).toBe(false);
  });
});

describe("defaultAppPathForRole", () => {
  it("sends super_admin to admin", () => {
    expect(defaultAppPathForRole("super_admin")).toBe("/admin");
  });

  it("sends clinic users to agenda", () => {
    expect(defaultAppPathForRole("clinic_admin")).toBe("/agenda");
    expect(defaultAppPathForRole("dentist")).toBe("/agenda");
  });
});
