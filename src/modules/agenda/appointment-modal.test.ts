import { describe, expect, it } from "vitest";
import type { Dentist, Patient } from "@/lib/supabase/types";
import { buildAppointmentInitialForm } from "./appointment-modal";
import type { AppointmentWithRelations } from "./types";

const dentists: Dentist[] = [
  {
    id: "dentist-1",
    clinic_id: "clinic",
    name: "Dra. Ana",
    color: "#4490E2",
    active: true,
  },
];

const patients: Patient[] = [
  {
    id: "patient-1",
    clinic_id: "clinic",
    name: "Marina Costa",
    phone: null,
    whatsapp: null,
    birth_date: null,
    notes: "",
  },
  {
    id: "patient-2",
    clinic_id: "clinic",
    name: "João Pereira",
    phone: null,
    whatsapp: null,
    birth_date: null,
    notes: "",
  },
];

describe("buildAppointmentInitialForm", () => {
  it("uses the URL patientId when creating a new appointment", () => {
    const form = buildAppointmentInitialForm(
      null,
      new Date("2026-06-11T08:00:00.000Z"),
      dentists,
      patients,
      [],
      "patient-2",
    );

    expect(form.patient_id).toBe("patient-2");
  });

  it("keeps the appointment patient when editing", () => {
    const appointment: AppointmentWithRelations = {
      id: "appointment-1",
      clinic_id: "clinic",
      dentist_id: "dentist-1",
      patient_id: "patient-1",
      starts_at: "2026-06-11T10:00:00.000Z",
      ends_at: "2026-06-11T10:30:00.000Z",
      duration_min: 30,
      procedure_label: "Retorno",
      status: "confirmed",
      notes: null,
      dentist: dentists[0],
      patient: patients[0],
    };

    const form = buildAppointmentInitialForm(
      appointment,
      new Date("2026-06-11T08:00:00.000Z"),
      dentists,
      patients,
      [],
      "patient-2",
    );

    expect(form.patient_id).toBe("patient-1");
  });
});
