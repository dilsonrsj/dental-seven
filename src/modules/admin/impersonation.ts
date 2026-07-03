import { cookies } from "next/headers";

export const IMPERSONATION_COOKIE = "ds_impersonation";
export const IMPERSONATION_MAX_MS = 2 * 60 * 60 * 1000;

export type ImpersonationPayload = {
  clinicId: string;
  startedAt: string;
  actorId: string;
};

export function parseImpersonationCookie(
  value: string | undefined,
): ImpersonationPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ImpersonationPayload;
    if (
      typeof parsed.clinicId !== "string" ||
      typeof parsed.startedAt !== "string" ||
      typeof parsed.actorId !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isImpersonationValid(
  payload: ImpersonationPayload,
  actorId: string,
  nowMs = Date.now(),
): boolean {
  if (payload.actorId !== actorId) return false;
  const started = new Date(payload.startedAt).getTime();
  if (Number.isNaN(started)) return false;
  return nowMs - started < IMPERSONATION_MAX_MS;
}

export function isImpersonationBlockedPath(pathname: string): boolean {
  if (/^\/pacientes\/[^/]+\/prontuario(\/|$)/.test(pathname)) return true;
  if (/^\/api\/clinics\/[^/]+\/export(\/|$)/.test(pathname)) return true;
  return false;
}

export function assertNotImpersonating(isImpersonating: boolean | undefined): void {
  if (isImpersonating) {
    const err = new Error("Modo suporte: alterações não permitidas.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export async function startImpersonation(
  clinicId: string,
  actorId: string,
): Promise<void> {
  const payload: ImpersonationPayload = {
    clinicId,
    startedAt: new Date().toISOString(),
    actorId,
  };
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATION_MAX_MS / 1000,
  });
}

export async function stopImpersonation(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
}
