import { describe, expect, it } from "vitest";
import {
  findDentistScheduleConflict,
  intervalsOverlap,
  pickOverlappingIdsToCancel,
} from "./appointment-overlap";

describe("intervalsOverlap", () => {
  it("detects overlapping ranges", () => {
    const a0 = new Date("2026-07-14T10:00:00.000Z");
    const a1 = new Date("2026-07-14T11:00:00.000Z");
    const b0 = new Date("2026-07-14T10:30:00.000Z");
    const b1 = new Date("2026-07-14T11:30:00.000Z");
    expect(intervalsOverlap(a0, a1, b0, b1)).toBe(true);
  });

  it("allows back-to-back slots", () => {
    const a0 = new Date("2026-07-14T10:00:00.000Z");
    const a1 = new Date("2026-07-14T11:00:00.000Z");
    const b0 = new Date("2026-07-14T11:00:00.000Z");
    const b1 = new Date("2026-07-14T12:00:00.000Z");
    expect(intervalsOverlap(a0, a1, b0, b1)).toBe(false);
  });
});

describe("findDentistScheduleConflict", () => {
  const existing = [
    {
      id: "a1",
      dentist_id: "d1",
      starts_at: "2026-07-14T10:00:00.000Z",
      ends_at: "2026-07-14T11:00:00.000Z",
      status: "confirmed",
    },
    {
      id: "a2",
      dentist_id: "d1",
      starts_at: "2026-07-14T14:00:00.000Z",
      ends_at: "2026-07-14T15:00:00.000Z",
      status: "cancelled",
    },
  ];

  it("finds overlap for the same dentist", () => {
    const hit = findDentistScheduleConflict(
      {
        dentist_id: "d1",
        starts_at: "2026-07-14T10:30:00.000Z",
        ends_at: "2026-07-14T11:30:00.000Z",
        status: "pending",
      },
      existing,
    );
    expect(hit?.id).toBe("a1");
  });

  it("ignores cancelled slots", () => {
    expect(
      findDentistScheduleConflict(
        {
          dentist_id: "d1",
          starts_at: "2026-07-14T14:00:00.000Z",
          ends_at: "2026-07-14T15:00:00.000Z",
          status: "pending",
        },
        existing,
      ),
    ).toBeNull();
  });

  it("ignores self when editing", () => {
    expect(
      findDentistScheduleConflict(
        {
          id: "a1",
          dentist_id: "d1",
          starts_at: "2026-07-14T10:00:00.000Z",
          ends_at: "2026-07-14T11:00:00.000Z",
          status: "confirmed",
        },
        existing,
      ),
    ).toBeNull();
  });

  it("allows another dentist at the same time", () => {
    expect(
      findDentistScheduleConflict(
        {
          dentist_id: "d2",
          starts_at: "2026-07-14T10:00:00.000Z",
          ends_at: "2026-07-14T11:00:00.000Z",
          status: "pending",
        },
        existing,
      ),
    ).toBeNull();
  });
});

describe("pickOverlappingIdsToCancel", () => {
  it("keeps confirmed and cancels overlapping pending", () => {
    const ids = pickOverlappingIdsToCancel([
      {
        id: "pending-row",
        dentist_id: "d1",
        starts_at: "2026-07-15T08:00:00.000Z",
        ends_at: "2026-07-15T08:30:00.000Z",
        status: "pending",
      },
      {
        id: "confirmed-row",
        dentist_id: "d1",
        starts_at: "2026-07-15T08:00:00.000Z",
        ends_at: "2026-07-15T08:30:00.000Z",
        status: "confirmed",
      },
      {
        id: "cancelled-ok",
        dentist_id: "d1",
        starts_at: "2026-07-15T08:00:00.000Z",
        ends_at: "2026-07-15T08:30:00.000Z",
        status: "cancelled",
      },
    ]);
    expect(ids).toEqual(["pending-row"]);
  });
});
