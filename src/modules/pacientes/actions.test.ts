import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_CLINIC_ID } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getPatient,
  getPatientAppointments,
  getPatients,
  updatePatientNotes,
} from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/context", () => ({
  requireClinicId: vi.fn(async () => DEMO_CLINIC_ID),
  getAuthContext: vi.fn(async () => ({
    clinic: { subscription_status: "active" },
    profile: { role: "clinic_admin" },
  })),
}));

const createClientMock = vi.mocked(createClient);
const revalidatePathMock = vi.mocked(revalidatePath);

describe("pacientes actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DEMO_MOCK_DATA", "false");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  it("searches patients by name, phone or whatsapp inside the demo clinic", async () => {
    const query = createQueryMock({
      data: [{ id: "patient-1", name: "Marina Costa" }],
      error: null,
    });
    createClientMock.mockResolvedValue(createSupabaseMock(query));

    const patients = await getPatients("marina");

    expect(patients).toEqual([{ id: "patient-1", name: "Marina Costa" }]);
    expect(query.eq).toHaveBeenCalledWith("clinic_id", DEMO_CLINIC_ID);
    expect(query.or).toHaveBeenCalledWith(
      "name.ilike.%marina%,phone.ilike.%marina%,whatsapp.ilike.%marina%",
    );
    expect(query.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("returns one patient scoped to the demo clinic", async () => {
    const query = createQueryMock({
      data: { id: "patient-1", name: "Marina Costa" },
      error: null,
    });
    createClientMock.mockResolvedValue(createSupabaseMock(query));

    const patient = await getPatient("patient-1");

    expect(patient).toEqual({ id: "patient-1", name: "Marina Costa" });
    expect(query.eq).toHaveBeenCalledWith("id", "patient-1");
    expect(query.eq).toHaveBeenCalledWith("clinic_id", DEMO_CLINIC_ID);
    expect(query.maybeSingle).toHaveBeenCalled();
  });

  it("updates patient notes and revalidates the patient detail page", async () => {
    const query = createQueryMock({
      data: { id: "patient-1", notes: "Novo plano de tratamento" },
      error: null,
    });
    createClientMock.mockResolvedValue(createSupabaseMock(query));

    const patient = await updatePatientNotes(
      "patient-1",
      "Novo plano de tratamento",
    );

    expect(patient).toEqual({
      id: "patient-1",
      notes: "Novo plano de tratamento",
    });
    expect(query.update).toHaveBeenCalledWith({
      notes: "Novo plano de tratamento",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/pacientes/patient-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/pacientes");
  });

  it("loads appointment history with dentist and patient relations", async () => {
    const query = createQueryMock({
      data: [{ id: "appointment-1", patient_id: "patient-1" }],
      error: null,
    });
    createClientMock.mockResolvedValue(createSupabaseMock(query));

    const appointments = await getPatientAppointments("patient-1");

    expect(appointments).toEqual([{ id: "appointment-1", patient_id: "patient-1" }]);
    expect(query.eq).toHaveBeenCalledWith("patient_id", "patient-1");
    expect(query.eq).toHaveBeenCalledWith("clinic_id", DEMO_CLINIC_ID);
    expect(query.order).toHaveBeenCalledWith("starts_at", {
      ascending: false,
    });
  });
});

function createSupabaseMock(query: QueryMock) {
  return {
    from: vi.fn(() => query),
  } as never;
}

type QueryMock = ReturnType<typeof createQueryMock>;

function createQueryMock(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    or: vi.fn(() => query),
    order: vi.fn(() => query),
    update: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return query;
}
