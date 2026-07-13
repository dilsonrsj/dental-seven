"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth/context";
import { notifyBetaFeedback } from "@/lib/email/feedback-notify";
import { isBetaGateEnabled } from "@/lib/founding/gate";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseBetaFeedbackInput,
  type BetaFeedbackInput,
} from "@/modules/feedback/validation";

export type SubmitBetaFeedbackResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitBetaFeedback(
  input: BetaFeedbackInput,
): Promise<SubmitBetaFeedbackResult> {
  if (!isBetaGateEnabled()) {
    return { ok: false, error: "Feedback da beta indisponível neste ambiente." };
  }

  const parsed = parseBetaFeedbackInput(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const ctx = await getAuthContext();
  if (!ctx?.clinic) {
    return { ok: false, error: "Sessão inválida. Entre novamente." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "Servidor não configurado: adicione SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    };
  }

  const { error } = await admin.from("beta_feedback").insert({
    clinic_id: ctx.clinic.id,
    profile_id: ctx.profile.id,
    nps: parsed.data.nps,
    top_module: parsed.data.topModule,
    liked_most: parsed.data.likedMost,
    blocked_or_missing: parsed.data.blockedOrMissing,
    would_use_today: parsed.data.wouldUseToday,
    notes: parsed.data.notes,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  void notifyBetaFeedback({
    ...parsed.data,
    clinicName: ctx.clinic.name,
    authorName: ctx.profile.full_name,
    authorEmail: ctx.email,
  });

  revalidatePath("/admin/founding");
  return { ok: true };
}
