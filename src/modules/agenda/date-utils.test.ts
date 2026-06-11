import { describe, expect, it } from "vitest";
import type { AppointmentWithRelations } from "./types";
import {
  filterAppointmentsByDentist,
  getAppointmentsForDate,
  getWeekDays,
} from "./date-utils";

const appointments: AppointmentWithRelations[] = [
  {
    id: "appt-2",
    clinic_id: "clinic",
    dentist_id: "dentist-a",
    patient_id: "patient-2",
    starts_at: "2026-06-11T13:00:00.000Z",
    ends_at: "2026-06-11T13:30:00.000Z",
    duration_min: 30,
    status: "confirmed",
    procedure_label: "Retorno",
    notes: null,
    dentist: {
      id: "dentist-a",
      clinic_id: "clinic",
      name: "Dra. Ana",
      color: "#4490E2",
      active: true,
    },
    patient: {
      id: "patient-2",
      clinic_id: "clinic",
      name: "João Pereira",
      phone: null,
      whatsapp: null,
      birth_date: null,
      notes: "",
    },
  },
  {
    id: "appt-1",
    clinic_id: "clinic",
    dentist_id: "dentist-b",
    patient_id: "patient-1",
    starts_at: "2026-06-11T11:00:00.000Z",
    ends_at: "2026-06-11T12:00:00.000Z",
    duration_min: 60,
    status: "pending",
    procedure_label: "Avaliação",
    notes: null,
    dentist: {
      id: "dentist-b",
      clinic_id: "clinic",
      name: "Dr. Carlos",
      color: "#6BA3E8",
      active: true,
    },
    patient: {
      id: "patient-1",
      clinic_id: "clinic",
      name: "Marina Costa",
      phone: null,
      whatsapp: null,
      birth_date: null,
      notes: "",
    },
  },
];

describe("getWeekDays", () => {
  it("returns Monday through Sunday for the selected week", () => {
    const weekDays = getWeekDays(new Date("2026-06-11T15:00:00.000Z"));

    expect(weekDays.map((date) => date.toISOString().slice(0, 10))).toEqual([
      "2026-06-08",
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
      "2026-06-14",
    ]);
  });
});

describe("getAppointmentsForDate", () => {
  it("returns the selected day appointments sorted by start time", () => {
    const result = getAppointmentsForDate(
      appointments,
      new Date("2026-06-11T00:00:00.000Z"),
    );

    expect(result.map((appointment) => appointment.id)).toEqual([
      "appt-1",
      "appt-2",
    ]);
  });
});

describe("filterAppointmentsByDentist", () => {
  it("keeps every appointment when the global filter is all", () => {
    expect(filterAppointmentsByDentist(appointments, "all")).toHaveLength(2);
  });

  it("keeps only the selected dentist appointments", () => {
    expect(
      filterAppointmentsByDentist(appointments, "dentist-a").map(
        (appointment) => appointment.id,
      ),
    ).toEqual(["appt-2"]);
  });
});
