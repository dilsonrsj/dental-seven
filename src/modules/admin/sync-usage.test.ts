import { describe, expect, it, vi } from "vitest";
import {
  countOutboundWhatsAppMessages,
  getCurrentYearMonth,
  getMonthUtcRange,
  syncClinicUsageMonthly,
} from "./sync-usage";

describe("sync-usage helpers", () => {
  it("formats current year_month in UTC", () => {
    expect(getCurrentYearMonth(new Date("2026-07-15T12:00:00.000Z"))).toBe("2026-07");
  });

  it("returns UTC month boundaries", () => {
    expect(getMonthUtcRange("2026-07")).toEqual({
      start: "2026-07-01T00:00:00.000Z",
      end: "2026-08-01T00:00:00.000Z",
    });
  });

  it("rejects invalid year_month", () => {
    expect(() => getMonthUtcRange("2026-13")).toThrow(/inválido/);
  });
});

describe("countOutboundWhatsAppMessages", () => {
  it("returns 0 when clinic has no threads", async () => {
    const threadsQuery = createQueryMock({ data: [], error: null });
    const admin = createSupabaseMock({ whatsapp_threads: threadsQuery });

    const count = await countOutboundWhatsAppMessages(
      admin,
      "clinic-1",
      "2026-07",
    );

    expect(count).toBe(0);
    expect(threadsQuery.eq).toHaveBeenCalledWith("clinic_id", "clinic-1");
  });

  it("counts outbound messages in the month for clinic threads", async () => {
    const threadsQuery = createQueryMock({
      data: [{ id: "thread-1" }, { id: "thread-2" }],
      error: null,
    });
    const messagesQuery = createQueryMock({ count: 7, error: null });
    const admin = createSupabaseMock({
      whatsapp_threads: threadsQuery,
      whatsapp_messages: messagesQuery,
    });

    const count = await countOutboundWhatsAppMessages(
      admin,
      "clinic-1",
      "2026-07",
    );

    expect(count).toBe(7);
    expect(messagesQuery.eq).toHaveBeenCalledWith("direction", "outbound");
    expect(messagesQuery.in).toHaveBeenCalledWith("thread_id", [
      "thread-1",
      "thread-2",
    ]);
    expect(messagesQuery.gte).toHaveBeenCalledWith(
      "sent_at",
      "2026-07-01T00:00:00.000Z",
    );
    expect(messagesQuery.lt).toHaveBeenCalledWith(
      "sent_at",
      "2026-08-01T00:00:00.000Z",
    );
  });
});

describe("syncClinicUsageMonthly", () => {
  it("upserts whatsapp usage for the clinic", async () => {
    const threadsQuery = createQueryMock({ data: [{ id: "thread-1" }], error: null });
    const messagesQuery = createQueryMock({ count: 3, error: null });
    const usageQuery = createQueryMock({
      data: {
        clinic_id: "clinic-1",
        year_month: "2026-07",
        whatsapp_conversations: 3,
        ai_responses: 0,
        storage_bytes: 0,
        updated_at: "2026-07-03T10:00:00.000Z",
      },
      error: null,
    });

    const admin = createSupabaseMock({
      whatsapp_threads: threadsQuery,
      whatsapp_messages: messagesQuery,
      clinic_usage_monthly: usageQuery,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-03T10:00:00.000Z"));

    const row = await syncClinicUsageMonthly("clinic-1", "2026-07", admin);

    expect(row.whatsapp_conversations).toBe(3);
    expect(usageQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        clinic_id: "clinic-1",
        year_month: "2026-07",
        whatsapp_conversations: 3,
        ai_responses: 0,
      }),
      { onConflict: "clinic_id,year_month" },
    );

    vi.useRealTimers();
  });
});

function createSupabaseMock(queries: Record<string, QueryMock>) {
  return {
    from: vi.fn((table: string) => queries[table]),
  } as never;
}

type QueryMock = ReturnType<typeof createQueryMock>;

function createQueryMock(result: Record<string, unknown>) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    upsert: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  return query;
}
