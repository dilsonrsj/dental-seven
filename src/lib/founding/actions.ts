"use server";

import { cookies } from "next/headers";
import { notifyFoundingSubmission } from "@/lib/email/founding-notify";
import {
  buildRefSlugBase,
  resolveUniqueRefSlug,
} from "@/lib/founding/ref-slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { FOUNDING_COOKIE } from "@/lib/founding/content";

export type FoundingFormInput = {
  fullName: string;
  clinicName: string;
  city: string;
  state: string;
  whatsapp: string;
  email: string;
  dentistCount: "1" | "2" | "3+";
  currentSystem: string;
  mainPain: string;
  inviteRef: string;
  acceptedTerms: boolean;
  marketingConsent: boolean;
};

export type FoundingSubmitResult =
  | { ok: true; accessToken: string }
  | { ok: false; error: string };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function normalizeWhatsapp(value: string): string {
  return value.replace(/\D/g, "");
}

function validateInput(input: FoundingFormInput): string | null {
  if (input.fullName.trim().length < 3) {
    return "Informe seu nome completo.";
  }
  if (input.clinicName.trim().length < 2) {
    return "Informe o nome da clínica ou consultório.";
  }
  if (input.city.trim().length < 2) {
    return "Informe a cidade.";
  }
  if (!/^[A-Z]{2}$/.test(input.state.trim().toUpperCase())) {
    return "Selecione o estado (UF).";
  }
  const whatsapp = normalizeWhatsapp(input.whatsapp);
  if (whatsapp.length < 10 || whatsapp.length > 11) {
    return "Informe um WhatsApp válido com DDD.";
  }
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@") || !email.includes(".")) {
    return "Informe um e-mail válido.";
  }
  if (input.mainPain.trim().length < 10) {
    return "Conte em poucas palavras o que mais atrapalha hoje (mín. 10 caracteres).";
  }
  if (!input.acceptedTerms) {
    return "Você precisa aceitar os Termos e a Política de Privacidade.";
  }
  if (!input.marketingConsent) {
    return "Precisamos do seu consentimento para contato sobre a beta e o lançamento.";
  }
  return null;
}

async function setFoundingCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(FOUNDING_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function submitFoundingForm(
  input: FoundingFormInput,
): Promise<FoundingSubmitResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "Servidor não configurado. Se o problema persistir, fale com a DR7 no WhatsApp.",
    };
  }

  const email = input.email.trim().toLowerCase();
  const payload = {
    full_name: input.fullName.trim(),
    clinic_name: input.clinicName.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    whatsapp: normalizeWhatsapp(input.whatsapp),
    email,
    dentist_count: input.dentistCount,
    current_system: input.currentSystem.trim() || null,
    main_pain: input.mainPain.trim(),
    invite_ref: input.inviteRef.trim() || null,
    accepted_terms: input.acceptedTerms,
    marketing_consent: input.marketingConsent,
  };

  const { data: existing } = await admin
    .from("beta_founders")
    .select("access_token")
    .eq("email", email)
    .maybeSingle();

  if (existing?.access_token) {
    await setFoundingCookie(existing.access_token);
    return { ok: true, accessToken: existing.access_token };
  }

  if (existing?.access_token) {
    await setFoundingCookie(existing.access_token);
    return { ok: true, accessToken: existing.access_token };
  }

  const refSlug = await resolveUniqueRefSlug(
    buildRefSlugBase(payload.full_name, payload.city, payload.state),
    async (slug) => {
      const { data } = await admin
        .from("beta_founders")
        .select("id")
        .eq("ref_slug", slug)
        .maybeSingle();
      return Boolean(data);
    },
  );

  const { data, error } = await admin
    .from("beta_founders")
    .insert({ ...payload, ref_slug: refSlug })
    .select("access_token")
    .single();

  if (error || !data?.access_token) {
    if (error?.code === "23505") {
      const { data: retry } = await admin
        .from("beta_founders")
        .select("access_token")
        .eq("email", email)
        .maybeSingle();
      if (retry?.access_token) {
        await setFoundingCookie(retry.access_token);
        return { ok: true, accessToken: retry.access_token };
      }
    }
    return {
      ok: false,
      error: error?.message ?? "Não foi possível registrar. Tente novamente.",
    };
  }

  await setFoundingCookie(data.access_token);

  await notifyFoundingSubmission({
    fullName: payload.full_name,
    clinicName: payload.clinic_name,
    city: payload.city,
    state: payload.state,
    whatsapp: payload.whatsapp,
    email: payload.email,
    dentistCount: payload.dentist_count,
    currentSystem: payload.current_system,
    mainPain: payload.main_pain,
    inviteRef: payload.invite_ref,
  });

  return { ok: true, accessToken: data.access_token };
}
