import { NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_VALUE,
  demoCookieOptions,
  verifyDemoPassword,
} from "@/lib/demo-session";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  if (!password || !verifyDemoPassword(password)) {
    return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, demoCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(DEMO_SESSION_COOKIE);
  return response;
}
