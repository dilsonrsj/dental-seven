"use server";

import { revalidatePath } from "next/cache";
import { isDemoMockDataEnabled } from "@/lib/demo/config";
import { demoStore } from "@/lib/demo/store";
import { getAuthContext, requireClinicId } from "@/lib/auth/context";
import { isSubscriptionBlocking } from "@/lib/billing/subscription";
import {
  type AppointmentStatus,
  type Patient,
  type WhatsappMessage,
  type WhatsappThread,
} from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

export type WhatsappThreadWithPatient = WhatsappThread & {
  patient: Patient | null;
};

async function assertWritable() {
  const ctx = await getAuthContext();
  if (
    !ctx?.clinic ||
    isSubscriptionBlocking(ctx.clinic.subscription_status, ctx.profile.role)
  ) {
    throw new Error("Assinatura inativa. Regularize em Configurações.");
  }
}

export async function isSupabaseConfigured() {
  if (isDemoMockDataEnabled()) return true;
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function getThreads(): Promise<WhatsappThreadWithPatient[]> {
  if (isDemoMockDataEnabled()) {
    return demoStore.getThreads();
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_threads")
    .select(
      `
        *,
        patient:patients(*)
      `,
    )
    .eq("clinic_id", clinicId)
    .order("last_message_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as WhatsappThreadWithPatient[];
}

export async function getMessages(threadId: string): Promise<WhatsappMessage[]> {
  if (isDemoMockDataEnabled()) {
    return demoStore.getMessages(threadId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("sent_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function simulateConfirmAppointment(
  threadId: string,
  appointmentId?: string,
) {
  if (appointmentId) {
    await updateAppointmentStatus(appointmentId, "confirmed");
  }

  return sendDemoMessage(
    threadId,
    "Consulta confirmada pelo WhatsApp demo. Em produção, este fluxo será executado via n8n.",
  );
}

export async function simulateReschedule(
  threadId: string,
  appointmentId?: string,
) {
  if (appointmentId) {
    await updateAppointmentStatus(appointmentId, "pending");
  }

  return sendDemoMessage(
    threadId,
    "Solicitação de reagendamento registrada. A equipe entrará em contato com novos horários. (Demo)",
  );
}

export async function simulateReminder(threadId: string) {
  return sendDemoMessage(
    threadId,
    "Lembrete: sua consulta está chegando. Responda esta mensagem para confirmar presença. (Demo)",
  );
}

export async function sendDemoMessage(
  threadId: string,
  body: string,
): Promise<WhatsappMessage> {
  if (!isDemoMockDataEnabled()) {
    if (!(await isSupabaseConfigured())) {
      throw new Error("Configure .env.local");
    }
    await assertWritable();
  }

  const messageBody = body.trim();
  if (!messageBody) {
    throw new Error("Mensagem vazia.");
  }

  if (isDemoMockDataEnabled()) {
    const data = demoStore.sendMessage(threadId, messageBody);
    revalidatePath("/whatsapp");
    return data;
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .insert({
      thread_id: threadId,
      direction: "outbound",
      body: messageBody,
      status: "sent",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const lastMessageAt = new Date().toISOString();
  const { error: threadError } = await supabase
    .from("whatsapp_threads")
    .update({ last_message_at: lastMessageAt })
    .eq("id", threadId)
    .eq("clinic_id", clinicId);

  if (threadError) throw new Error(threadError.message);

  revalidatePath("/whatsapp");
  return data as WhatsappMessage;
}

async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
) {
  if (isDemoMockDataEnabled()) {
    demoStore.updateAppointmentStatus(appointmentId, status);
    revalidatePath("/agenda");
    return;
  }

  const clinicId = await requireClinicId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId);

  if (error) throw new Error(error.message);
  revalidatePath("/agenda");
}
