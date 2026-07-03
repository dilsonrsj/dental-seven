import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAuditAction =
  | "clinic.plan_changed"
  | "clinic.trial_extended"
  | "clinic.suspended"
  | "clinic.reactivated"
  | "clinic.module_toggled"
  | "clinic.export_requested"
  | "clinic.notes_updated"
  | "clinic.provisioned"
  | "clinic.impersonation_started"
  | "clinic.impersonation_stopped"
  | "clinic.whatsapp_throttle_set";

export type LogAdminActionInput = {
  actorId: string;
  action: AdminAuditAction;
  clinicId?: string | null;
  metadata?: Record<string, unknown>;
  admin?: SupabaseClient;
};

export async function logAdminAction({
  actorId,
  action,
  clinicId = null,
  metadata = {},
  admin = createAdminClient(),
}: LogAdminActionInput): Promise<void> {
  const { error } = await admin.from("admin_audit_log").insert({
    actor_id: actorId,
    action,
    clinic_id: clinicId,
    metadata,
  });

  if (error) {
    throw new Error(`Falha ao registrar auditoria: ${error.message}`);
  }
}
