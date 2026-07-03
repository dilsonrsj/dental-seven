import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClinicUsageMonthlyRow = {
  clinic_id: string;
  year_month: string;
  whatsapp_conversations: number;
  ai_responses: number;
  storage_bytes: number;
  updated_at: string;
};

export function getCurrentYearMonth(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthUtcRange(yearMonth: string): { start: string; end: string } {
  const [yearText, monthText] = yearMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error(`year_month inválido: ${yearMonth}`);
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function countOutboundWhatsAppMessages(
  admin: SupabaseClient,
  clinicId: string,
  yearMonth: string,
): Promise<number> {
  const { start, end } = getMonthUtcRange(yearMonth);

  const { data: threads, error: threadsError } = await admin
    .from("whatsapp_threads")
    .select("id")
    .eq("clinic_id", clinicId);

  if (threadsError) {
    throw new Error(threadsError.message);
  }

  const threadIds = (threads ?? []).map((thread) => thread.id);
  if (threadIds.length === 0) return 0;

  const { count, error } = await admin
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("direction", "outbound")
    .in("thread_id", threadIds)
    .gte("sent_at", start)
    .lt("sent_at", end);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function syncClinicUsageMonthly(
  clinicId: string,
  yearMonth = getCurrentYearMonth(),
  admin: SupabaseClient = createAdminClient(),
): Promise<ClinicUsageMonthlyRow> {
  const whatsappConversations = await countOutboundWhatsAppMessages(
    admin,
    clinicId,
    yearMonth,
  );

  const row = {
    clinic_id: clinicId,
    year_month: yearMonth,
    whatsapp_conversations: whatsappConversations,
    ai_responses: 0,
    storage_bytes: 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("clinic_usage_monthly")
    .upsert(row, { onConflict: "clinic_id,year_month" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Falha ao sincronizar uso mensal");
  }

  return data as ClinicUsageMonthlyRow;
}

export async function syncAllClinicsUsageMonthly(
  yearMonth = getCurrentYearMonth(),
  admin: SupabaseClient = createAdminClient(),
): Promise<ClinicUsageMonthlyRow[]> {
  const { data: clinics, error } = await admin
    .from("clinics")
    .select("id")
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  const rows: ClinicUsageMonthlyRow[] = [];
  for (const clinic of clinics ?? []) {
    rows.push(await syncClinicUsageMonthly(clinic.id, yearMonth, admin));
  }
  return rows;
}
