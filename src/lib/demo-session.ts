export const DEMO_SESSION_COOKIE = "demo_session";
export const DEMO_SESSION_VALUE = "demo_authenticated";

export function verifyDemoPassword(input: string): boolean {
  const expected = process.env.DEMO_PASSWORD ?? "";
  return expected.length > 0 && input === expected;
}

export function isValidDemoSession(value: string | null | undefined): boolean {
  return value === DEMO_SESSION_VALUE;
}

export const demoCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
