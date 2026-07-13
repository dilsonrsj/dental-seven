import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { FOUNDING_COOKIE } from "@/lib/founding/content";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type BetaFounderRow = {
  id: string;
  access_token: string;
  full_name: string;
  clinic_name: string;
  city: string;
  state: string;
  whatsapp: string;
  email: string;
  dentist_count: string;
  current_system: string | null;
  main_pain: string;
  invite_ref: string | null;
};

export function isBetaGateEnabled(): boolean {
  return process.env.DENTAL_SEVEN_BETA_GATE === "true";
}

export function isValidFoundingToken(token: string | undefined): boolean {
  return Boolean(token && UUID_RE.test(token));
}

export async function validateFoundingAccess(): Promise<
  | { valid: true; founder: BetaFounderRow }
  | { valid: false }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(FOUNDING_COOKIE)?.value;

  if (!isValidFoundingToken(token)) {
    return { valid: false };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("beta_founders")
      .select(
        "id, access_token, full_name, clinic_name, city, state, whatsapp, email, dentist_count, current_system, main_pain, invite_ref",
      )
      .eq("access_token", token!)
      .maybeSingle();

    if (error || !data) {
      return { valid: false };
    }

    return { valid: true, founder: data as BetaFounderRow };
  } catch {
    return { valid: false };
  }
}

export async function markFoundingAccessed(accessToken: string): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("beta_founders")
      .update({ accessed_at: new Date().toISOString() })
      .eq("access_token", accessToken)
      .is("accessed_at", null);
  } catch {
    // non-blocking
  }
}

export async function linkFounderToClinic(
  email: string,
  clinicId: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("beta_founders")
      .update({
        clinic_id: clinicId,
        signup_completed_at: new Date().toISOString(),
      })
      .eq("email", email.trim().toLowerCase());
  } catch {
    // non-blocking
  }
}
