import { describe, expect, it, vi } from "vitest";
import { logAdminAction } from "./audit";

describe("logAdminAction", () => {
  it("inserts audit row with actor, action and metadata", async () => {
    const auditQuery = createQueryMock({ error: null });
    const admin = {
      from: vi.fn(() => auditQuery),
    } as never;

    await logAdminAction({
      actorId: "actor-1",
      action: "clinic.plan_changed",
      clinicId: "clinic-1",
      metadata: { from: "conecta", to: "completo" },
      admin,
    });

    expect(admin.from).toHaveBeenCalledWith("admin_audit_log");
    expect(auditQuery.insert).toHaveBeenCalledWith({
      actor_id: "actor-1",
      action: "clinic.plan_changed",
      clinic_id: "clinic-1",
      metadata: { from: "conecta", to: "completo" },
    });
  });

  it("throws when insert fails", async () => {
    const auditQuery = createQueryMock({ error: { message: "db error" } });
    const admin = {
      from: vi.fn(() => auditQuery),
    } as never;

    await expect(
      logAdminAction({
        actorId: "actor-1",
        action: "clinic.suspended",
        admin,
      }),
    ).rejects.toThrow(/Falha ao registrar auditoria/);
  });
});

function createQueryMock(result: Record<string, unknown>) {
  const query = {
    insert: vi.fn(() => Promise.resolve(result)),
  };
  return query;
}
