import { describe, expect, it } from "vitest";
import {
  IMPERSONATION_MAX_MS,
  isImpersonationBlockedPath,
  isImpersonationValid,
  parseImpersonationCookie,
} from "./impersonation";

describe("parseImpersonationCookie", () => {
  it("parses valid JSON payload", () => {
    const payload = {
      clinicId: "clinic-1",
      startedAt: "2026-07-03T10:00:00.000Z",
      actorId: "actor-1",
    };
    expect(parseImpersonationCookie(JSON.stringify(payload))).toEqual(payload);
  });

  it("returns null for invalid JSON", () => {
    expect(parseImpersonationCookie("not-json")).toBeNull();
  });

  it("returns null for missing fields", () => {
    expect(parseImpersonationCookie(JSON.stringify({ clinicId: "x" }))).toBeNull();
  });
});

describe("isImpersonationValid", () => {
  const payload = {
    clinicId: "clinic-1",
    startedAt: new Date().toISOString(),
    actorId: "actor-1",
  };

  it("accepts fresh session for matching actor", () => {
    expect(isImpersonationValid(payload, "actor-1")).toBe(true);
  });

  it("rejects mismatched actor", () => {
    expect(isImpersonationValid(payload, "actor-2")).toBe(false);
  });

  it("rejects expired session", () => {
    const expired = {
      ...payload,
      startedAt: new Date(Date.now() - IMPERSONATION_MAX_MS - 1000).toISOString(),
    };
    expect(isImpersonationValid(expired, "actor-1")).toBe(false);
  });
});

describe("isImpersonationBlockedPath", () => {
  it("blocks prontuario routes", () => {
    expect(isImpersonationBlockedPath("/pacientes/abc/prontuario")).toBe(true);
    expect(isImpersonationBlockedPath("/pacientes/abc/prontuario/notas")).toBe(
      true,
    );
  });

  it("allows other clinic paths", () => {
    expect(isImpersonationBlockedPath("/pacientes/abc")).toBe(false);
    expect(isImpersonationBlockedPath("/agenda")).toBe(false);
  });

  it("blocks clinic export API", () => {
    expect(isImpersonationBlockedPath("/api/clinics/abc/export")).toBe(true);
  });
});
