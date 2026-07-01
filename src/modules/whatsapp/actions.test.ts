import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { DEMO_CLINIC_ID } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";
import {
  getMessages,
  getThreads,
  sendDemoMessage,
  simulateConfirmAppointment,
  simulateReminder,
  simulateReschedule,
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

describe("whatsapp actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DEMO_MOCK_DATA", "false");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  it("loads demo threads with patient relation ordered by recent activity", async () => {
    const threadsQuery = createQueryMock({
      data: [{ id: "thread-1", patient: { name: "Marina Costa" } }],
      error: null,
    });
    createClientMock.mockResolvedValue(createSupabaseMock({ whatsapp_threads: threadsQuery }));

    const threads = await getThreads();

    expect(threads).toEqual([{ id: "thread-1", patient: { name: "Marina Costa" } }]);
    expect(threadsQuery.eq).toHaveBeenCalledWith("clinic_id", DEMO_CLINIC_ID);
    expect(threadsQuery.order).toHaveBeenCalledWith("last_message_at", {
      ascending: false,
    });
  });

  it("loads messages by thread ordered chronologically", async () => {
    const messagesQuery = createQueryMock({
      data: [{ id: "message-1", body: "Oi", sent_at: "2026-06-11T12:00:00.000Z" }],
      error: null,
    });
    createClientMock.mockResolvedValue(createSupabaseMock({ whatsapp_messages: messagesQuery }));

    const messages = await getMessages("thread-1");

    expect(messages).toEqual([
      { id: "message-1", body: "Oi", sent_at: "2026-06-11T12:00:00.000Z" },
    ]);
    expect(messagesQuery.eq).toHaveBeenCalledWith("thread_id", "thread-1");
    expect(messagesQuery.order).toHaveBeenCalledWith("sent_at", { ascending: true });
  });

  it("sends outbound demo messages and refreshes the inbox", async () => {
    const messageQuery = createQueryMock({
      data: { id: "message-2", thread_id: "thread-1", direction: "outbound" },
      error: null,
    });
    const threadQuery = createQueryMock({ data: null, error: null });
    const supabase = createSupabaseMock({
      whatsapp_messages: messageQuery,
      whatsapp_threads: threadQuery,
    });
    createClientMock.mockResolvedValue(supabase);

    const message = await sendDemoMessage("thread-1", "Mensagem demo");

    expect(message).toEqual({
      id: "message-2",
      thread_id: "thread-1",
      direction: "outbound",
    });
    expect(messageQuery.insert).toHaveBeenCalledWith({
      thread_id: "thread-1",
      direction: "outbound",
      body: "Mensagem demo",
      status: "sent",
    });
    expect(threadQuery.update).toHaveBeenCalledWith({ last_message_at: expect.any(String) });
    expect(threadQuery.eq).toHaveBeenCalledWith("id", "thread-1");
    expect(threadQuery.eq).toHaveBeenCalledWith("clinic_id", DEMO_CLINIC_ID);
    expect(revalidatePathMock).toHaveBeenCalledWith("/whatsapp");
  });

  it("simulates confirmation and marks the appointment as confirmed", async () => {
    const messageQuery = createQueryMock({
      data: { id: "message-confirm", body: "Consulta confirmada" },
      error: null,
    });
    const threadQuery = createQueryMock({ data: null, error: null });
    const appointmentQuery = createQueryMock({
      data: { id: "appointment-1", status: "confirmed" },
      error: null,
    });
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        whatsapp_messages: messageQuery,
        whatsapp_threads: threadQuery,
        appointments: appointmentQuery,
      }),
    );

    await simulateConfirmAppointment("thread-1", "appointment-1");

    expect(appointmentQuery.update).toHaveBeenCalledWith({ status: "confirmed" });
    expect(appointmentQuery.eq).toHaveBeenCalledWith("id", "appointment-1");
    expect(messageQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining("confirmada"),
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/agenda");
  });

  it("simulates reschedule and moves appointment status back to pending", async () => {
    const messageQuery = createQueryMock({
      data: { id: "message-reschedule", body: "Reagendamento" },
      error: null,
    });
    const threadQuery = createQueryMock({ data: null, error: null });
    const appointmentQuery = createQueryMock({
      data: { id: "appointment-1", status: "pending" },
      error: null,
    });
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        whatsapp_messages: messageQuery,
        whatsapp_threads: threadQuery,
        appointments: appointmentQuery,
      }),
    );

    await simulateReschedule("thread-1", "appointment-1");

    expect(appointmentQuery.update).toHaveBeenCalledWith({ status: "pending" });
    expect(messageQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining("reagendamento"),
      }),
    );
  });

  it("simulates reminders without requiring an appointment update", async () => {
    const messageQuery = createQueryMock({
      data: { id: "message-reminder", body: "Lembrete" },
      error: null,
    });
    const threadQuery = createQueryMock({ data: null, error: null });
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        whatsapp_messages: messageQuery,
        whatsapp_threads: threadQuery,
      }),
    );

    await simulateReminder("thread-1");

    expect(messageQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining("Lembrete"),
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/whatsapp");
  });
});

function createSupabaseMock(queries: Record<string, QueryMock>) {
  return {
    from: vi.fn((table: string) => queries[table]),
  } as never;
}

type QueryMock = ReturnType<typeof createQueryMock>;

function createQueryMock(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    update: vi.fn(() => query),
    insert: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return query;
}
