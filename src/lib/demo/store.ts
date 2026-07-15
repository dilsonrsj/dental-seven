import {
  DEMO_CLINIC_ID,
  type Appointment,
  type AppointmentStatus,
  type Dentist,
  type Patient,
  type WhatsappMessage,
  type WhatsappThread,
} from "@/lib/supabase/types";
import appointmentTemplates from "@/data/demo/appointments.json";
import dentistSeed from "@/data/demo/dentists.json";
import patientSeed from "@/data/demo/patients.json";
import messageTemplates from "@/data/demo/whatsapp-messages.json";
import threadTemplates from "@/data/demo/whatsapp-threads.json";
import type { AppointmentWithRelations } from "@/modules/agenda/types";

type AppointmentTemplate = (typeof appointmentTemplates)[number];
type ThreadTemplate = (typeof threadTemplates)[number];
type MessageTemplate = (typeof messageTemplates)[number];

type WhatsappThreadWithPatient = WhatsappThread & {
  patient: Patient | null;
};

function startOfWeekUtc(reference = new Date()): Date {
  const date = new Date(
    Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), reference.getUTCDate()),
  );
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function atWeekOffset(
  dayOffset: number,
  hour: number,
  minute: number,
  reference = new Date(),
): Date {
  const base = startOfWeekUtc(reference);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  base.setUTCHours(hour, minute, 0, 0);
  return base;
}

function resolveAppointment(template: AppointmentTemplate, reference = new Date()): Appointment {
  const startsAt = atWeekOffset(
    template.day_offset,
    template.start_hour,
    template.start_minute,
    reference,
  );
  const endsAt = new Date(startsAt.getTime() + template.duration_min * 60 * 1000);

  return {
    id: template.id,
    clinic_id: DEMO_CLINIC_ID,
    dentist_id: template.dentist_id,
    patient_id: template.patient_id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    duration_min: template.duration_min,
    status: template.status as AppointmentStatus,
    procedure_label: template.procedure_label,
    notes: template.notes,
  };
}

function resolveThread(template: ThreadTemplate, reference = new Date()): WhatsappThread {
  return {
    id: template.id,
    clinic_id: DEMO_CLINIC_ID,
    patient_id: template.patient_id,
    last_message_at: atWeekOffset(
      template.day_offset,
      template.hour,
      template.minute,
      reference,
    ).toISOString(),
  };
}

function resolveMessage(template: MessageTemplate, reference = new Date()): WhatsappMessage {
  return {
    id: template.id,
    thread_id: template.thread_id,
    direction: template.direction as WhatsappMessage["direction"],
    body: template.body,
    sent_at: atWeekOffset(
      template.day_offset,
      template.hour,
      template.minute,
      reference,
    ).toISOString(),
    status: template.status as WhatsappMessage["status"],
  };
}

function withRelations(
  appointment: Appointment,
  dentists: Dentist[],
  patients: Patient[],
): AppointmentWithRelations {
  return {
    ...appointment,
    dentist: dentists.find((d) => d.id === appointment.dentist_id) ?? null,
    patient: patients.find((p) => p.id === appointment.patient_id) ?? null,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createInitialState(reference = new Date()) {
  const dentists = clone(dentistSeed) as Dentist[];
  const patients = clone(patientSeed) as Patient[];
  const appointments = (appointmentTemplates as AppointmentTemplate[]).map((t) =>
    resolveAppointment(t, reference),
  );
  const threads = (threadTemplates as ThreadTemplate[]).map((t) =>
    resolveThread(t, reference),
  );
  const messages = (messageTemplates as MessageTemplate[]).map((m) =>
    resolveMessage(m, reference),
  );

  return { dentists, patients, appointments, threads, messages };
}

type DemoState = ReturnType<typeof createInitialState>;

let state: DemoState | null = null;

function getState(): DemoState {
  if (!state) {
    state = createInitialState();
  }
  return state;
}

export function resetDemoStore() {
  state = createInitialState();
}

export const demoStore = {
  getDentists(): Dentist[] {
    return clone(getState().dentists.filter((d) => d.active));
  },

  getPatients(search?: string): Patient[] {
    const term = search?.trim().toLowerCase();
    let list = clone(getState().patients);
    if (term) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.phone ?? "").toLowerCase().includes(term) ||
          (p.whatsapp ?? "").toLowerCase().includes(term),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  },

  getPatient(id: string): Patient | null {
    return getState().patients.find((p) => p.id === id) ?? null;
  },

  updatePatientNotes(id: string, notes: string): Patient {
    const patient = getState().patients.find((p) => p.id === id);
    if (!patient) throw new Error("Paciente não encontrado.");
    patient.notes = notes;
    return clone(patient);
  },

  getAppointments(from: string, to: string, dentistId?: string): AppointmentWithRelations[] {
    const { appointments, dentists, patients } = getState();
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();

    return appointments
      .filter((a) => {
        const t = new Date(a.starts_at).getTime();
        if (t < fromMs || t > toMs) return false;
        if (dentistId && dentistId !== "all" && a.dentist_id !== dentistId) return false;
        return true;
      })
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .map((a) => withRelations(a, dentists, patients));
  },

  getPatientAppointments(patientId: string): AppointmentWithRelations[] {
    const { appointments, dentists, patients } = getState();
    return appointments
      .filter((a) => a.patient_id === patientId)
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
      .map((a) => withRelations(a, dentists, patients));
  },

  upsertAppointment(input: {
    id?: string;
    patient_id: string;
    dentist_id: string;
    starts_at: string;
    ends_at: string;
    duration_min: number;
    procedure_id?: string | null;
    procedure_label: string;
    status: AppointmentStatus;
    notes?: string | null;
  }): AppointmentWithRelations {
    const { appointments, dentists, patients } = getState();
    const payload: Appointment = {
      id: input.id ?? crypto.randomUUID(),
      clinic_id: DEMO_CLINIC_ID,
      patient_id: input.patient_id,
      dentist_id: input.dentist_id,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      duration_min: input.duration_min,
      procedure_id: input.procedure_id ?? null,
      procedure_label: input.procedure_label,
      status: input.status,
      notes: input.notes ?? null,
    };

    const index = appointments.findIndex((a) => a.id === payload.id);
    if (index >= 0) {
      appointments[index] = payload;
    } else {
      appointments.push(payload);
    }

    return withRelations(payload, dentists, patients);
  },

  updateAppointmentStatus(id: string, status: AppointmentStatus): AppointmentWithRelations {
    const { appointments, dentists, patients } = getState();
    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) throw new Error("Consulta não encontrada.");
    appointment.status = status;
    return withRelations(appointment, dentists, patients);
  },

  deleteAppointment(id: string): void {
    const { appointments } = getState();
    const index = appointments.findIndex((a) => a.id === id);
    if (index < 0) throw new Error("Consulta não encontrada.");
    appointments.splice(index, 1);
  },

  getThreads(): WhatsappThreadWithPatient[] {
    const { threads, patients } = getState();
    return clone(threads)
      .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
      .map((thread) => ({
        ...thread,
        patient: patients.find((p) => p.id === thread.patient_id) ?? null,
      }));
  },

  getMessages(threadId: string): WhatsappMessage[] {
    return clone(
      getState()
        .messages.filter((m) => m.thread_id === threadId)
        .sort((a, b) => a.sent_at.localeCompare(b.sent_at)),
    );
  },

  sendMessage(threadId: string, body: string): WhatsappMessage {
    const { messages, threads } = getState();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) throw new Error("Conversa não encontrada.");

    const message: WhatsappMessage = {
      id: crypto.randomUUID(),
      thread_id: threadId,
      direction: "outbound",
      body,
      sent_at: new Date().toISOString(),
      status: "sent",
    };

    messages.push(message);
    thread.last_message_at = message.sent_at;
    return clone(message);
  },
};
